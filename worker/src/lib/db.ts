// worker/src/lib/db.ts

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  APP_JWT_SECRET: string;
}

function sbHeaders(env: Env, extra = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function sbSelect(env: Env, table: string, query: string, select: string) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&${query}`;
  const res = await fetch(url, { headers: sbHeaders(env) });
  if (!res.ok) throw new Error(`SB_SELECT_${table}_${res.status}`);
  return await res.json();
}

export async function sbSelectOne(env: Env, table: string, query: string, select: string) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&${query}`;
  const res = await fetch(url, { headers: sbHeaders(env, { Accept: "application/json" }) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`SB_SELECTONE_${table}_${res.status}`);
  const rows: any = await res.json();
  return rows?.[0] ?? null;
}

export async function sbInsert(env: Env, table: string, obj: any) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: "POST",
    headers: sbHeaders(env, { Prefer: "return=representation" }),
    body: JSON.stringify(obj),
  });
  if (!res.ok) throw new Error(`SB_INSERT_${table}_${res.status}`);
  return await res.json().catch(() => null);
}

export async function sbPatch(env: Env, table: string, filter: string, obj: any) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?${filter}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: sbHeaders(env, { Prefer: "return=representation" }),
    body: JSON.stringify(obj),
  });
  if (!res.ok) throw new Error(`SB_PATCH_${table}_${res.status}`);
  return await res.json().catch(() => null);
}

export async function sbDelete(env: Env, table: string, filter: string) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?${filter}`;
  const res = await fetch(url, { method: "DELETE", headers: sbHeaders(env) });
  if (!res.ok) throw new Error(`SB_DELETE_${table}_${res.status}`);
  return true;
}

export async function sbCount(env: Env, table: string, filterQuery: string) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?select=id&${filterQuery}`;
  const res = await fetch(url, {
    method: "HEAD",
    headers: sbHeaders(env, {
      Prefer: "count=exact",
      "Range-Unit": "items",
      Range: "0-0",
    }),
  });
  if (!res.ok) throw new Error(`SB_COUNT_${table}_${res.status}`);
  const cr = res.headers.get("Content-Range") || "";
  const m = cr.match(/\/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

export async function getOrCreateUser(env: Env, tgUser: any) {
  const telegramId = String(tgUser.id);
  const existing: any = await sbSelectOne(
    env,
    "users",
    `telegram_id=eq.${telegramId}&limit=1`,
    "id,telegram_id,display_name,avatar_id,theme,streak_current,streak_best,total_questions_answered,is_disabled,last_active_at,created_at"
  );

  const now = new Date().toISOString();

  if (existing) {
    await sbPatch(env, "users", `id=eq.${existing.id}`, { last_active_at: now });
    return { ...existing, last_active_at: now };
  }

  const displayName = tgUser.first_name
      ? `${tgUser.first_name}${tgUser.last_name ? " " + tgUser.last_name : ""}`
      : (tgUser.username ? tgUser.username : "کاربر");

  const inserted: any = await sbInsert(env, "users", {
    telegram_id: telegramId,
    display_name: displayName,
    avatar_id: 0,
    theme: "dark",
    streak_current: 0,
    streak_best: 0,
    total_questions_answered: 0,
    is_disabled: false,
    last_active_at: now,
  });

  return Array.isArray(inserted) ? inserted[0] : inserted;
}

export function mapUser(u: any) {
  const avatarId = typeof u.avatar_id === "number" ? u.avatar_id : Number.parseInt(u.avatar_id, 10);
  return {
    id: u.id,
    telegram_id: u.telegram_id,
    display_name: u.display_name,
    avatar_id: Number.isFinite(avatarId) ? avatarId : 0,
    theme: u.theme,
    streak_current: u.streak_current ?? 0,
    streak_best: u.streak_best ?? 0,
    total_answered: u.total_questions_answered ?? 0,
    created_at: u.created_at,
  };
}

export async function touchUser(env: Env, userId: string, wasCorrect: boolean) {
  const u: any = await sbSelectOne(env, "users", `id=eq.${userId}&limit=1`, "id,total_questions_answered,streak_current,streak_best,last_active_at,last_practice_date");
  if (!u) return;

  const now = new Date();
  const today = now.toISOString().slice(0,10);
  let streakCurrent = u.streak_current ?? 0;
  let streakBest = u.streak_best ?? 0;

  if (u.last_practice_date !== today) {
    const y = new Date(now);
    y.setUTCDate(y.getUTCDate() - 1);
    const yesterday = y.toISOString().slice(0,10);
    if (u.last_practice_date === yesterday) streakCurrent = streakCurrent + 1;
    else streakCurrent = 1;
    streakBest = Math.max(streakBest, streakCurrent);
  }

  const patch = {
    last_active_at: now.toISOString(),
    last_practice_date: today,
    streak_current: streakCurrent,
    streak_best: streakBest,
    total_questions_answered: (u.total_questions_answered ?? 0) + 1,
  };
  await sbPatch(env, "users", `id=eq.${userId}`, patch);
}
