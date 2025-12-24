// worker/src/routes/session.ts
import { Env, sbSelect, sbSelectOne, sbInsert, sbPatch, sbDelete, sbCount, touchUser } from "../lib/db";
import { json, safeJson, clampInt, shuffle, pickSome, addDaysISO, clampEF } from "../lib/utils";
import { requireAuth } from "../lib/auth";

export async function handleSession(request: Request, env: Env, pathname: string, origin: string) {
  const auth = await requireAuth(request, env);
  if (!auth.ok) return json({ error: auth.error }, 401, origin);
  const userId = auth.uid;

  // POST /sessions/create
  if (pathname === "/api/app/v1/sessions/create" && request.method === "POST") {
    const body: any = await safeJson(request);
    const subtopicId = body?.subtopic_id;
    const mode = body?.mode;
    const size = clampInt(body?.size ?? 10, 5, 30);

    const allowedModes = new Set(["daily_mix", "due_only", "weak_first", "new_only", "bookmarks", "review_free"]);
    if (!subtopicId) return json({ error: "subtopic_id required" }, 400, origin);
    if (!allowedModes.has(mode)) return json({ error: "invalid mode" }, 400, origin);

    const sessionId = crypto.randomUUID();
    const now = Date.now();
    
    const states = await sbSelect(env, "user_question_state", `user_id=eq.${userId}&subtopic_id=eq.${subtopicId}`, "question_id,total_attempts,correct_attempts,next_due_at,box_number");
    
    const seenIds = new Set(states.map((s:any) => s.question_id));
    const dueIds = states
      .filter((s:any) => s.next_due_at && new Date(s.next_due_at).getTime() <= now)
      .map((s:any) => s.question_id);

    const WEAK_MIN = 3;
    const WEAK_ACC = 0.4;
    const weakIds = states
      .filter((s:any) => (s.total_attempts || 0) >= WEAK_MIN && ((s.correct_attempts || 0) / Math.max(1, s.total_attempts || 0)) < WEAK_ACC)
      .map((s:any) => s.question_id);

    const picked: string[] = [];
    
    if (mode === "due_only") {
      picked.push(...pickSome(shuffle(dueIds), size));
    } else if (mode === "weak_first") {
      picked.push(...pickSome(shuffle(weakIds), size));
      if (picked.length < size) picked.push(...pickSome(shuffle(dueIds.filter((id:any) => !picked.includes(id))), size - picked.length));
    } else if (mode === "new_only") {
      const need = size;
      const notIn = Array.from(seenIds).join(",") || "00000000-0000-0000-0000-000000000000";
      const newRows = await sbSelect(env, "questions", `subtopic_id=eq.${subtopicId}&is_active=eq.true&id=not.in.(${notIn})&limit=${need}`, "id");
      picked.push(...newRows.map((r:any) => r.id));
    } else if (mode === "bookmarks") {
      const b = await sbSelect(env, "user_bookmark", `user_id=eq.${userId}&order=created_at.desc&limit=${size}`, "question_id");
      picked.push(...b.map((x:any) => x.question_id));
    } else if (mode === "review_free") {
      const future = states
        .filter((s:any) => s.next_due_at && new Date(s.next_due_at).getTime() > now)
        .sort((a:any, b:any) => new Date(a.next_due_at).getTime() - new Date(b.next_due_at).getTime())
        .map((s:any) => s.question_id);
      picked.push(...pickSome(future, size));
      if (picked.length < size) picked.push(...pickSome(shuffle(dueIds.filter((id:any) => !picked.includes(id))), size - picked.length));
    } else {
      // daily_mix
      const dueBacklog = dueIds.length;
      const newRatio = dueBacklog > 50 ? 0.05 : 0.15;
      const weakRatio = 0.25;
      const dueRatio = 1 - newRatio - weakRatio;

      const dueNeed = Math.max(0, Math.round(size * dueRatio));
      const weakNeed = Math.max(0, Math.round(size * weakRatio));
      const newNeed = Math.max(0, size - dueNeed - weakNeed);

      picked.push(...pickSome(shuffle(dueIds), dueNeed));
      picked.push(...pickSome(shuffle(weakIds.filter((id:any) => !picked.includes(id))), weakNeed));

      const seenList = Array.from(seenIds);
      const notIn = seenList.length ? seenList.join(",") : "00000000-0000-0000-0000-000000000000";
      const newRows = await sbSelect(env, "questions", `subtopic_id=eq.${subtopicId}&is_active=eq.true&id=not.in.(${notIn})&limit=${newNeed}`, "id");
      picked.push(...newRows.map((r:any) => r.id));

      if (picked.length < size) {
        const future = states
          .filter((s:any) => s.next_due_at && new Date(s.next_due_at).getTime() > now)
          .sort((a:any, b:any) => new Date(a.next_due_at).getTime() - new Date(b.next_due_at).getTime())
          .map((s:any) => s.question_id)
          .filter((id:any) => !picked.includes(id));
        picked.push(...pickSome(future, size - picked.length));
      }
    }

    if (!picked.length) return json({ session_id: sessionId, questions: [] }, 200, origin);

    const qRows = await sbSelect(env, "questions", `id=in.(${picked.join(",")})`, "id,stem:stem_text,options:choices_json");
    
    const qMap = new Map(qRows.map((q:any) => [q.id, q]));
    const questions = picked
      .map(id => qMap.get(id))
      .filter(Boolean)
      .map((q:any) => ({
        question_id: q.id,
        stem: q.stem,
        choices: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
      }));

    return json({ session_id: sessionId, mode, size: questions.length, questions }, 200, origin);
  }

  // POST /answers/submit
  if (pathname === "/api/app/v1/answers/submit" && request.method === "POST") {
    const body: any = await safeJson(request);
    const { attempt_id, question_id, chosen_index, is_dont_know } = body;

    // FIX: Select explanation_text directly
    const q = await sbSelectOne(env, "questions", `id=eq.${question_id}`, "id,subtopic_id,correct_choice_index,explanation_text");
    if (!q) return json({ code: "QUESTION_NOT_FOUND" }, 200, origin);

    const correctIndex = q.correct_choice_index;
    const wasCorrect = !is_dont_know && Number(chosen_index) === Number(correctIndex);

    let state = await sbSelectOne(env, "user_question_state", `user_id=eq.${userId}&question_id=eq.${question_id}`, "*");
    
    let ef = state?.ef ?? 2.5;
    let interval = state?.interval_days ?? 0;
    let box = state?.box_number ?? 1;
    let totalAttempts = (state?.total_attempts ?? 0);
    let correctAttempts = (state?.correct_attempts ?? 0);

    const quality = is_dont_know ? 1 : (wasCorrect ? 5 : 2);
    ef = clampEF(ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    if (totalAttempts === 0) {
        interval = 1;
    } else if (totalAttempts === 1) {
        interval = wasCorrect ? 6 : 1;
    } else {
        interval = wasCorrect ? Math.round(Math.max(1, interval) * ef) : 1;
    }

    if (wasCorrect) box = Math.min(6, box + 1);
    else box = Math.max(1, box - 2);

    totalAttempts += 1;
    if(wasCorrect) correctAttempts += 1;

    const patch = {
      user_id: userId,
      question_id,
      subtopic_id: q.subtopic_id,
      ef, interval_days: interval, box_number: box,
      next_due_at: addDaysISO(interval),
      total_attempts: totalAttempts,
      correct_attempts: correctAttempts,
      last_review_at: new Date().toISOString()
    };

    if (!state) await sbInsert(env, "user_question_state", patch);
    else await sbPatch(env, "user_question_state", `id=eq.${state.id}`, patch);

    await sbInsert(env, "user_question_attempt", {
      user_id: userId, question_id, subtopic_id: q.subtopic_id, attempt_id,
      chosen_index, was_correct: wasCorrect, quality, ef_after: ef, interval_after: interval
    });

    await touchUser(env, userId, wasCorrect);

    return json({ 
      was_correct: wasCorrect, 
      correct_choice_index: correctIndex, 
      // FIX: Return as explanation_text to match frontend expectation
      explanation_text: q.explanation_text,
      sm2: { ef, interval, next_due: patch.next_due_at }
    }, 200, origin);
  }

  // Bookmarks & Reports
  if (pathname === "/api/app/v1/bookmarks/toggle") {
     const body: any = await safeJson(request);
     const { question_id, subtopic_id } = body;
     const exists = await sbSelectOne(env, "user_bookmark", `user_id=eq.${userId}&question_id=eq.${question_id}`, "question_id");
     if(exists) {
        await sbDelete(env, "user_bookmark", `user_id=eq.${userId}&question_id=eq.${question_id}`);
        return json({ is_bookmarked: false }, 200, origin);
     } else {
        await sbInsert(env, "user_bookmark", { user_id: userId, question_id, subtopic_id });
        return json({ is_bookmarked: true }, 200, origin);
     }
  }

  if (pathname === "/api/app/v1/bookmarks/list" && request.method === "GET") {
     const url = new URL(request.url);
     const page = clampInt(url.searchParams.get("page") ?? 1, 1, 9999);
     const pageSize = clampInt(url.searchParams.get("page_size") ?? 20, 1, 50);
     const from = (page - 1) * pageSize;
     
     const bRows = await sbSelect(env, "user_bookmark", `user_id=eq.${userId}&order=created_at.desc&limit=${pageSize}&offset=${from}`, "question_id,created_at");
     
     if (!bRows.length) return json({ page, page_size: pageSize, total: 0, items: [] }, 200, origin);

     const ids = bRows.map((r:any) => r.question_id);
     const qRows = await sbSelect(env, "questions", `id=in.(${ids.join(",")})`, "id,stem:stem_text");
     const qMap = new Map(qRows.map((q:any) => [q.id, q]));
     const items = bRows.map((b:any) => ({
        question_id: b.question_id,
        stem_preview: (qMap.get(b.question_id)?.stem ?? "").slice(0, 140),
        bookmarked_at: b.created_at,
     }));
     const total = await sbCount(env, "user_bookmark", `user_id=eq.${userId}`);
     return json({ page, page_size: pageSize, total, items }, 200, origin);
  }

  if (pathname === "/api/app/v1/reports/create") {
    const body: any = await safeJson(request);
    const { question_id, subtopic_id, issue_type, message } = body;
    await sbInsert(env, "question_report", { 
      user_id: userId, 
      question_id, 
      report_type: issue_type,
      message 
    });
    return json({ ok: true }, 200, origin);
  }

  return json({ error: "Not found" }, 404, origin);
}
