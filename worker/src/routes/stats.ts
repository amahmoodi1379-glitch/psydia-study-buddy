// worker/src/routes/stats.ts
import { Env, sbSelect, sbCount, sbSelectOne } from "../lib/db";
import { json, pct } from "../lib/utils";
import { requireAuth } from "../lib/auth";

export async function handleStats(request: Request, env: Env, pathname: string, origin: string) {
  const auth = await requireAuth(request, env);
  if (!auth.ok) return json({ error: auth.error }, 401, origin);
  const userId = auth.uid;

  // GET /stats/heatmap
  if (pathname === "/api/app/v1/stats/heatmap") {
     const days = 28;
     const start = new Date();
     start.setUTCDate(start.getUTCDate() - (days - 1));
     start.setUTCHours(0,0,0,0);

     const rows = await sbSelect(env, "user_question_attempts", `user_id=eq.${userId}&created_at=gte.${start.toISOString()}&order=created_at.asc`, "created_at");
     
     const map = new Map();
     for(const r of rows) {
        const d = (r.created_at||"").slice(0,10);
        map.set(d, (map.get(d)||0)+1);
     }
     
     const cells = [];
     let max = 0;
     for(let i=0; i<days; i++) {
        const d = new Date(start);
        d.setUTCDate(start.getUTCDate() + i);
        const k = d.toISOString().slice(0,10);
        const c = map.get(k)||0;
        if(c > max) max = c;
        cells.push({ date: k, count: c, intensity: 0 });
     }
     cells.forEach(c => c.intensity = max ? Math.min(4, Math.floor((c.count/max)*4)) : 0);
     return json({ days: cells }, 200, origin);
  }

  // GET /stats/activity-7d
  if (pathname === "/api/app/v1/stats/activity-7d") {
    const days = 7;
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - (days - 1));
    start.setUTCHours(0,0,0,0);
    
    const rows = await sbSelect(env, "user_question_attempts", `user_id=eq.${userId}&created_at=gte.${start.toISOString()}&order=created_at.asc`, "created_at");
    
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
     const states = await sbSelect(env, "user_question_state", `user_id=eq.${userId}&subtopic_id=eq.${subId}`, "total_attempts,correct_attempts,box_number,next_due_at");
     
     const answered = states.reduce((a:number, s:any) => a + (s.total_attempts || 0), 0);
     const correct = states.reduce((a:number, s:any) => a + (s.correct_attempts || 0), 0);
     const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : null;
     const due = states.filter((s:any) => s.next_due_at && new Date(s.next_due_at).getTime() <= Date.now()).length;

     const WEAK_MIN = 3; const WEAK_ACC = 0.4;
     const weak = states.filter((s:any) => (s.total_attempts || 0) >= WEAK_MIN && ((s.correct_attempts || 0) / Math.max(1, s.total_attempts || 0)) < WEAK_ACC).length;
     const mastered = states.filter((s:any) => (s.box_number || 1) >= 4 && (s.total_attempts || 0) >= 3).length;
     const almost = states.filter((s:any) => (s.box_number || 1) >= 2 && (s.box_number || 1) <= 3 && (s.total_attempts || 0) >= 2).length;
     
     const boxDist = [1,2,3,4,5,6].map(b => ({ box_number: b, count: states.filter((s:any) => (s.box_number||1) === b).length }));

     return json({ 
       subtopic_id: subId,
       total_questions: total, 
       total_answered: answered,
       accuracy_percent: accuracy,
       due_today: due,
       bucket_mastered: pct(mastered, total),
       bucket_weak: pct(weak, total),
       bucket_almost: pct(almost, total),
       bucket_other: pct(Math.max(0, total - (mastered + weak + almost)), total),
       box_distribution: boxDist
     }, 200, origin);
  }

  // GET /stats/subject/:id
  const mSubj = pathname.match(/^\/api\/app\/v1\/stats\/subject\/([^/]+)$/);
  if (mSubj) {
      const subjectId = mSubj[1];
      const topics = await sbSelect(env, "topics", `subject_id=eq.${subjectId}&is_active=eq.true`, "id");
      const topicIds = topics.map((t:any) => t.id);
      
      if (!topicIds.length) return json({ subject_id: subjectId, total_questions: 0 }, 200, origin);

      const subs = await sbSelect(env, "subtopics", `topic_id=in.(${topicIds.join(",")})&is_active=eq.true`, "id");
      const subIds = subs.map((s:any) => s.id);

      if (!subIds.length) return json({ subject_id: subjectId, total_questions: 0 }, 200, origin);

      let totalQuestions = 0;
      for (const sid of subIds) totalQuestions += await sbCount(env, "questions", `subtopic_id=eq.${sid}&is_active=eq.true`);

      const states = await sbSelect(env, "user_question_state", `user_id=eq.${userId}&subtopic_id=in.(${subIds.join(",")})`, "total_attempts,correct_attempts,box_number,next_due_at");
      
      // ... logic similar to subtopic stats, repeating for subject aggregate ...
      const answered = states.reduce((a:number, s:any) => a + (s.total_attempts || 0), 0);
      const correct = states.reduce((a:number, s:any) => a + (s.correct_attempts || 0), 0);
      const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : null;
      const due = states.filter((s:any) => s.next_due_at && new Date(s.next_due_at).getTime() <= Date.now()).length;

      const WEAK_MIN = 3; const WEAK_ACC = 0.4;
      const weak = states.filter((s:any) => (s.total_attempts || 0) >= WEAK_MIN && ((s.correct_attempts || 0) / Math.max(1, s.total_attempts || 0)) < WEAK_ACC).length;
      const mastered = states.filter((s:any) => (s.box_number || 1) >= 4 && (s.total_attempts || 0) >= 3).length;
      const almost = states.filter((s:any) => (s.box_number || 1) >= 2 && (s.box_number || 1) <= 3 && (s.total_attempts || 0) >= 2).length;

      // activity 7d for subject
      const start = new Date(); start.setUTCDate(start.getUTCDate() - 6);
      const atts = await sbSelect(env, "user_question_attempts", `user_id=eq.${userId}&created_at=gte.${start.toISOString()}`, "created_at");
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
          bucket_mastered: pct(mastered, totalQuestions),
          bucket_weak: pct(weak, totalQuestions),
          bucket_almost: pct(almost, totalQuestions),
          bucket_other: pct(Math.max(0, totalQuestions - (mastered + weak + almost)), totalQuestions),
          activity_7d: act7d
      }, 200, origin);
  }

  return json({ error: "Not found" }, 404, origin);
}
