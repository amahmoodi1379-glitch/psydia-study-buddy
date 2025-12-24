// worker/src/routes/stats.ts
import { Env, sbSelect, sbCount, sbSelectOne } from "../lib/db";
import { json, pct } from "../lib/utils";
import { requireAuth } from "../lib/auth";
import { buildLastThreeMap, classifyQuestionBucket, MIN_CLASSIFICATION_ATTEMPTS } from "../lib/buckets";

type SubtopicRow = {
  id: string;
  title_fa: string;
  topic_id: string;
  display_order: number | null;
};

type QuestionRow = {
  id: string;
  subtopic_id: string;
};

type UserQuestionStateRow = {
  question_id: string;
  subtopic_id: string;
  total_attempts: number | null;
  correct_attempts: number | null;
  box_number: number | null;
  interval_days: number | null;
  next_due_at?: string | null;
};

type UserQuestionAttemptRow = {
  question_id: string;
  was_correct: boolean | null;
  created_at?: string | null;
};

type TopicRow = {
  id: string;
};

export async function handleStats(request: Request, env: Env, pathname: string, origin: string) {
  const auth = await requireAuth(request, env);
  if (!auth.ok) return json({ error: auth.error }, 401, origin);
  const userId = auth.uid;

  // GET /stats/heatmap
  if (pathname === "/api/app/v1/stats/heatmap") {
    const subtopics = (await sbSelect(
      env,
      "subtopics",
      "is_active=eq.true&order=display_order.asc",
      "id,title_fa,topic_id,display_order"
    )) as SubtopicRow[];
    const subtopicIds = subtopics.map((sub) => sub.id);
    if (!subtopicIds.length) return json({ subtopics: [] }, 200, origin);

    const questions = (await sbSelect(
      env,
      "questions",
      `subtopic_id=in.(${subtopicIds.join(",")})&is_active=eq.true`,
      "id,subtopic_id"
    )) as QuestionRow[];
    const totalsBySubtopic = new Map<string, number>();
    for (const q of questions) {
      totalsBySubtopic.set(q.subtopic_id, (totalsBySubtopic.get(q.subtopic_id) ?? 0) + 1);
    }

    const states = (await sbSelect(
      env,
      "user_question_state",
      `user_id=eq.${userId}&subtopic_id=in.(${subtopicIds.join(",")})`,
      "question_id,subtopic_id,total_attempts,correct_attempts,box_number,interval_days"
    )) as UserQuestionStateRow[];

    const attempts = (await sbSelect(
      env,
      "user_question_attempt",
      `user_id=eq.${userId}&subtopic_id=in.(${subtopicIds.join(",")})&order=created_at.desc`,
      "question_id,was_correct,created_at"
    )) as UserQuestionAttemptRow[];

    const lastThreeByQuestion = buildLastThreeMap(attempts);
    const statesBySubtopic = new Map<string, UserQuestionStateRow[]>();
    for (const state of states) {
      const list = statesBySubtopic.get(state.subtopic_id) ?? [];
      list.push(state);
      statesBySubtopic.set(state.subtopic_id, list);
    }

    const subtopicHeatmap = subtopics.map((sub) => {
      const subStates = statesBySubtopic.get(sub.id) ?? [];
      const totalQuestions = totalsBySubtopic.get(sub.id) ?? 0;
      const counts = { mastered: 0, almost: 0, weak: 0, insufficient: Math.max(0, totalQuestions - subStates.length) };

      const confidenceScores: number[] = [];
      for (const state of subStates) {
        const totalAttempts = state.total_attempts ?? 0;
        const correctAttempts = state.correct_attempts ?? 0;
        const boxNumber = state.box_number ?? 1;
        const intervalDays = state.interval_days ?? 0;
        const lastThree = lastThreeByQuestion.get(state.question_id) ?? [];
        const bucket = classifyQuestionBucket({
          totalAttempts,
          correctAttempts,
          boxNumber,
          intervalDays,
          lastThreeCorrect: lastThree,
        });
        counts[bucket] += 1;

        if (totalAttempts >= MIN_CLASSIFICATION_ATTEMPTS) {
          const lastThreeAccuracy = lastThree.length
            ? lastThree.filter(Boolean).length / lastThree.length
            : totalAttempts
              ? correctAttempts / totalAttempts
              : 0;
          confidenceScores.push(lastThreeAccuracy);
        }
      }

      const masteryPercent = pct(counts.mastered, totalQuestions);
      const confidencePercent = confidenceScores.length > 0
        ? Math.round((confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length) * 100)
        : 0;
      const intensity = Math.min(4, Math.floor(masteryPercent / 25));

      return {
        subtopic_id: sub.id,
        subtopic_name: sub.title_fa,
        topic_id: sub.topic_id,
        total_questions: totalQuestions,
        mastery_percent: masteryPercent,
        confidence_percent: confidencePercent,
        intensity,
      };
    });

    return json({ subtopics: subtopicHeatmap }, 200, origin);
  }

  // GET /stats/activity-7d
  if (pathname === "/api/app/v1/stats/activity-7d") {
    const days = 7;
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - (days - 1));
    start.setUTCHours(0,0,0,0);
    
    // FIX: Table name user_question_attempts -> user_question_attempt
    const rows = await sbSelect(env, "user_question_attempt", `user_id=eq.${userId}&created_at=gte.${start.toISOString()}&order=created_at.asc`, "created_at");
    
    const map = new Map();
    for(const r of rows) { const d = (r.created_at || "").slice(0,10); map.set(d, (map.get(d)||0)+1); }
    
    const out = [];
    for(let i=0; i<days; i++) {
       const d = new Date(start); d.setUTCDate(start.getUTCDate()+i); const k = d.toISOString().slice(0,10);
       out.push({ date: k, count: map.get(k)||0 });
    }
    const u = await sbSelectOne(env, "users", `id=eq.${userId}`, "streak_current,streak_best");
    return json({ days: out, streak_current: u?.streak_current ?? 0, streak_best: u?.streak_best ?? 0 }, 200, origin);
  }

  // GET /stats/subtopic/:id
  const mSub = pathname.match(/^\/api\/app\/v1\/stats\/subtopic\/([^/]+)$/);
  if (mSub) {
     const subId = mSub[1];
     const total = await sbCount(env, "questions", `subtopic_id=eq.${subId}&is_active=eq.true`);
     const states = (await sbSelect(
       env,
       "user_question_state",
       `user_id=eq.${userId}&subtopic_id=eq.${subId}`,
       "question_id,total_attempts,correct_attempts,box_number,interval_days,next_due_at"
     )) as UserQuestionStateRow[];
     const attempts = (await sbSelect(
       env,
       "user_question_attempt",
       `user_id=eq.${userId}&subtopic_id=eq.${subId}&order=created_at.desc`,
       "question_id,was_correct,created_at"
     )) as UserQuestionAttemptRow[];
     const lastThreeByQuestion = buildLastThreeMap(attempts);
     
     const answered = states.reduce((a, s) => a + (s.total_attempts || 0), 0);
     const correct = states.reduce((a, s) => a + (s.correct_attempts || 0), 0);
     const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : null;
     const due = states.filter((s) => s.next_due_at && new Date(s.next_due_at).getTime() <= Date.now()).length;

     const counts = { mastered: 0, almost: 0, weak: 0, insufficient: Math.max(0, total - states.length) };
     for (const state of states) {
       const totalAttempts = state.total_attempts ?? 0;
       const correctAttempts = state.correct_attempts ?? 0;
       const boxNumber = state.box_number ?? 1;
       const intervalDays = state.interval_days ?? 0;
       const lastThree = lastThreeByQuestion.get(state.question_id) ?? [];
       const bucket = classifyQuestionBucket({
         totalAttempts,
         correctAttempts,
         boxNumber,
         intervalDays,
         lastThreeCorrect: lastThree,
       });
       counts[bucket] += 1;
     }
     
     const boxDist = [1, 2, 3, 4, 5, 6].map((b) => ({
       box_number: b,
       count: states.filter((s) => (s.box_number || 1) === b).length,
     }));

     return json({ 
       subtopic_id: subId,
       total_questions: total, 
       total_answered: answered,
       accuracy_percent: accuracy,
       due_today: due,
       bucket_mastered: pct(counts.mastered, total),
       bucket_weak: pct(counts.weak, total),
       bucket_almost: pct(counts.almost, total),
       bucket_insufficient: pct(counts.insufficient, total),
       box_distribution: boxDist
     }, 200, origin);
  }

  // GET /stats/subject/:id
  const mSubj = pathname.match(/^\/api\/app\/v1\/stats\/subject\/([^/]+)$/);
  if (mSubj) {
      const subjectId = mSubj[1];
      const topics = (await sbSelect(env, "topics", `subject_id=eq.${subjectId}&is_active=eq.true`, "id")) as TopicRow[];
      const topicIds = topics.map((t) => t.id);
      
      if (!topicIds.length) return json({ subject_id: subjectId, total_questions: 0 }, 200, origin);

      const subs = (await sbSelect(
        env,
        "subtopics",
        `topic_id=in.(${topicIds.join(",")})&is_active=eq.true`,
        "id"
      )) as SubtopicRow[];
      const subIds = subs.map((s) => s.id);

      if (!subIds.length) return json({ subject_id: subjectId, total_questions: 0 }, 200, origin);

      const totalQuestions = subIds.length
        ? await sbCount(env, "questions", `subtopic_id=in.(${subIds.join(",")})&is_active=eq.true`)
        : 0;

      const states = (await sbSelect(
        env,
        "user_question_state",
        `user_id=eq.${userId}&subtopic_id=in.(${subIds.join(",")})`,
        "question_id,subtopic_id,total_attempts,correct_attempts,box_number,interval_days,next_due_at"
      )) as UserQuestionStateRow[];
      const attempts = (await sbSelect(
        env,
        "user_question_attempt",
        `user_id=eq.${userId}&subtopic_id=in.(${subIds.join(",")})&order=created_at.desc`,
        "question_id,was_correct,created_at"
      )) as UserQuestionAttemptRow[];
      const lastThreeByQuestion = buildLastThreeMap(attempts);
      
      const answered = states.reduce((a, s) => a + (s.total_attempts || 0), 0);
      const correct = states.reduce((a, s) => a + (s.correct_attempts || 0), 0);
      const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : null;
      const due = states.filter((s) => s.next_due_at && new Date(s.next_due_at).getTime() <= Date.now()).length;

      const counts = { mastered: 0, almost: 0, weak: 0, insufficient: Math.max(0, totalQuestions - states.length) };
      for (const state of states) {
        const totalAttempts = state.total_attempts ?? 0;
        const correctAttempts = state.correct_attempts ?? 0;
        const boxNumber = state.box_number ?? 1;
        const intervalDays = state.interval_days ?? 0;
        const lastThree = lastThreeByQuestion.get(state.question_id) ?? [];
        const bucket = classifyQuestionBucket({
          totalAttempts,
          correctAttempts,
          boxNumber,
          intervalDays,
          lastThreeCorrect: lastThree,
        });
        counts[bucket] += 1;
      }

      // FIX: Table name user_question_attempts -> user_question_attempt
      const start = new Date(); start.setUTCDate(start.getUTCDate() - 6);
      const atts = await sbSelect(env, "user_question_attempt", `user_id=eq.${userId}&created_at=gte.${start.toISOString()}`, "created_at");
      const map = new Map();
      for(const r of atts) { const d = (r.created_at||"").slice(0,10); map.set(d, (map.get(d)||0)+1); }
      const act7d = [];
      for(let i=0; i<7; i++) {
        const d = new Date(start); d.setUTCDate(start.getUTCDate() + i); const k = d.toISOString().slice(0,10);
        act7d.push({ date: k, count: map.get(k)||0 });
      }

      return json({
          subject_id: subjectId,
          total_questions: totalQuestions,
          total_answered: answered,
          accuracy_percent: accuracy,
          due_today: due,
          bucket_mastered: pct(counts.mastered, totalQuestions),
          bucket_weak: pct(counts.weak, totalQuestions),
          bucket_almost: pct(counts.almost, totalQuestions),
          bucket_insufficient: pct(counts.insufficient, totalQuestions),
          activity_7d: act7d
      }, 200, origin);
  }

  return json({ error: "Not found" }, 404, origin);
}
