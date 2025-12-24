// worker/src/routes/content.ts
import { Env, sbSelect, sbCount, sbSelectOne } from "../lib/db";
import { json, computeStatusLabel } from "../lib/utils";
import { requireAuth } from "../lib/auth";

export async function handleContent(request: Request, env: Env, pathname: string, searchParams: URLSearchParams, origin: string) {
  const auth = await requireAuth(request, env);
  if (!auth.ok) return json({ error: auth.error }, 401, origin);
  const userId = auth.uid;

  // GET /subjects
  if (pathname === "/api/app/v1/subjects" && request.method === "GET") {
    const subjects = await sbSelect(env, "subjects", "is_active=eq.true&order=display_order.asc", "id,title_fa,display_order,is_active");
    const out = [];
    for (const s of subjects) {
      const topicCount = await sbCount(env, "topics", `subject_id=eq.${s.id}&is_active=eq.true`);
      out.push({
        id: s.id,
        name: s.title_fa,
        icon_emoji: "📚",
        topic_count: topicCount,
        order: s.display_order ?? 0,
      });
    }
    return json(out, 200, origin);
  }

  // GET /topics
  if (pathname === "/api/app/v1/topics" && request.method === "GET") {
    const subjectId = searchParams.get("subject_id");
    if (!subjectId) return json({ error: "subject_id is required" }, 400, origin);

    const topics = await sbSelect(env, "topics", `subject_id=eq.${subjectId}&is_active=eq.true&order=display_order.asc`, "id,subject_id,title_fa,display_order,is_active");
    const out = [];
    for (const t of topics) {
      const subCount = await sbCount(env, "subtopics", `topic_id=eq.${t.id}&is_active=eq.true`);
      out.push({
        id: t.id,
        subject_id: t.subject_id,
        name: t.title_fa,
        subtopic_count: subCount,
        order: t.display_order ?? 0,
      });
    }
    return json(out, 200, origin);
  }

  // GET /subtopics
  if (pathname === "/api/app/v1/subtopics" && request.method === "GET") {
    const topicId = searchParams.get("topic_id");
    if (!topicId) return json({ error: "topic_id is required" }, 400, origin);

    const subs = await sbSelect(env, "subtopics", `topic_id=eq.${topicId}&is_active=eq.true&order=display_order.asc`, "id,topic_id,title_fa,display_order,is_active");
    const out = [];
    for (const st of subs) {
      const qCount = await sbCount(env, "questions", `subtopic_id=eq.${st.id}&is_active=eq.true`);
      out.push({
        id: st.id,
        topic_id: st.topic_id,
        name: st.title_fa,
        question_count: qCount,
        order: st.display_order ?? 0,
      });
    }
    return json(out, 200, origin);
  }

  // GET /subtopics/:id/overview
  const mOverview = pathname.match(/^\/api\/app\/v1\/subtopics\/([^/]+)\/overview$/);
  if (mOverview && request.method === "GET") {
    const subtopicId = mOverview[1];
    const sub = await sbSelectOne(env, "subtopics", `id=eq.${subtopicId}`, "id,title_fa,topic_id");
    if (!sub) return json({ error: "SUBTOPIC_NOT_FOUND" }, 404, origin);

    const topic = await sbSelectOne(env, "topics", `id=eq.${sub.topic_id}`, "id,title_fa,subject_id");
    const subject = topic ? await sbSelectOne(env, "subjects", `id=eq.${topic.subject_id}`, "id,title_fa") : null;

    const totalQuestions = await sbCount(env, "questions", `subtopic_id=eq.${subtopicId}&is_active=eq.true`);
    const states = await sbSelect(env, "user_question_state", `user_id=eq.${userId}&subtopic_id=eq.${subtopicId}`, "question_id,total_attempts,correct_attempts,next_due_at,box_number");

    const seenSet = new Set(states.map((x: any) => x.question_id));
    const dueCount = states.filter((x: any) => x.next_due_at && new Date(x.next_due_at).getTime() <= Date.now()).length;
    
    const WEAK_MIN = 3; 
    const WEAK_ACC = 0.4;
    const SUFFICIENT_DATA_THRESHOLD = 6;
    const weakCount = states.filter((x: any) => (x.total_attempts || 0) >= WEAK_MIN && ((x.correct_attempts || 0) / Math.max(1, x.total_attempts || 0)) < WEAK_ACC).length;
    const newCount = Math.max(0, totalQuestions - seenSet.size);

    const totalAnswered = states.reduce((a: number, x: any) => a + (x.total_attempts || 0), 0);
    const totalCorrect = states.reduce((a: number, x: any) => a + (x.correct_attempts || 0), 0);
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;
    const hasSufficientData = totalAnswered >= SUFFICIENT_DATA_THRESHOLD;

    // FIX: Table name user_question_attempts -> user_question_attempt
    const lastAttempt = await sbSelectOne(env, "user_question_attempt", `user_id=eq.${userId}&subtopic_id=eq.${subtopicId}&order=created_at.desc&limit=1`, "created_at");
    
    return json({
      subtopic_id: sub.id,
      subtopic_name: sub.title_fa,
      topic_name: topic?.title_fa ?? "",
      subject_name: subject?.title_fa ?? "",
      status_label: computeStatusLabel({ dueCount, weakCount, newCount, totalAnswered, accuracy }),
      due_count: dueCount,
      weak_count: weakCount,
      new_count: newCount,
      has_sufficient_data: hasSufficientData,
      total_answered: totalAnswered,
      accuracy_percent: accuracy,
      last_session_at: lastAttempt?.created_at ?? null,
    }, 200, origin);
  }

  return json({ error: "Not found" }, 404, origin);
}
