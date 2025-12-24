import { Env, sbSelectOne, sbInsert, sbPatch, getOrCreateUser, mapUser } from "../lib/db";
import { json, safeJson, nowSec } from "../lib/utils";
import { verifyTelegramInitData, signJwt, requireAuth } from "../lib/auth";

const USER_SELECT_FIELDS = "id,telegram_id,display_name,avatar_id,theme,streak_current,streak_best,total_questions_answered,is_disabled,last_active_at";
const VALID_THEMES = new Set(["light", "dark"]);
const AVATAR_MIN_ID = 0;
const AVATAR_MAX_ID = 29;

export async function handleAuth(request: Request, env: Env, pathname: string, origin: string) {
  
  // POST /auth/telegram
  if (pathname === "/api/app/v1/auth/telegram" && request.method === "POST") {
    const body: any = await safeJson(request);
    const initData = body?.init_data;
    if (!initData) return json({ error: "init_data is required" }, 400, origin);

    const tg = await verifyTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN);
    
    if (!tg.ok) {
      console.log("Auth Failed:", tg.error);
      return json({ error: tg.error }, 401, origin);
    }

    const timeDiff = tg.authDate ? (nowSec() - tg.authDate) : 99999;
    if (tg.authDate && timeDiff > 300) { // 5 minutes exp
       return json({ error: "AUTH_DATE_TOO_OLD" }, 401, origin);
    }

    const telegramUser = tg.user;
    if (!telegramUser?.id) return json({ error: "TELEGRAM_USER_MISSING" }, 401, origin);

    // DB Sync
    const dbUser = await getOrCreateUser(env, telegramUser);
    if (dbUser.is_disabled) return json({ error: "USER_DISABLED" }, 403, origin);

    // Create JWT
    const token = await signJwt(
      {
        uid: dbUser.id,
        tid: dbUser.telegram_id,
        iat: nowSec(),
        exp: nowSec() + 60 * 60 * 24 * 30, // 30 days
      },
      env.APP_JWT_SECRET
    );

    return json({ token, user: mapUser(dbUser) }, 200, origin);
  }

  // GET /user/me
  if (pathname === "/api/app/v1/user/me" && request.method === "GET") {
    const auth = await requireAuth(request, env);
    if (!auth.ok) return json({ error: auth.error }, 401, origin);

    const u = await sbSelectOne(env, "users", `id=eq.${auth.uid}`, USER_SELECT_FIELDS);
    
    if (!u) return json({ error: "USER_NOT_FOUND" }, 404, origin);
    return json(mapUser(u), 200, origin);
  }

  // PATCH /user/me
  if (pathname === "/api/app/v1/user/me" && request.method === "PATCH") {
    const auth = await requireAuth(request, env);
    if (!auth.ok) return json({ error: auth.error }, 401, origin);

    const body: any = await safeJson(request);
    const patch: Record<string, string | number> = {};

    if (body?.display_name !== undefined) {
      if (typeof body.display_name !== "string") {
        return json({ error: "INVALID_DISPLAY_NAME" }, 400, origin);
      }
      const displayName = body.display_name.trim();
      if (!displayName) {
        return json({ error: "INVALID_DISPLAY_NAME" }, 400, origin);
      }
      patch.display_name = displayName;
    }

    if (body?.avatar_id !== undefined) {
      if (!Number.isInteger(body.avatar_id)) {
        return json({ error: "INVALID_AVATAR_ID" }, 400, origin);
      }
      if (body.avatar_id < AVATAR_MIN_ID || body.avatar_id > AVATAR_MAX_ID) {
        return json({ error: "INVALID_AVATAR_ID" }, 400, origin);
      }
      patch.avatar_id = body.avatar_id;
    }

    if (body?.theme !== undefined) {
      if (typeof body.theme !== "string" || !VALID_THEMES.has(body.theme)) {
        return json({ error: "INVALID_THEME" }, 400, origin);
      }
      patch.theme = body.theme;
    }

    if (Object.keys(patch).length === 0) {
      return json({ error: "NO_FIELDS_TO_UPDATE" }, 400, origin);
    }

    const updated = await sbPatch(env, "users", `id=eq.${auth.uid}`, patch);
    const updatedUser = Array.isArray(updated) ? updated[0] : updated;

    if (updatedUser) return json(mapUser(updatedUser), 200, origin);

    const u = await sbSelectOne(env, "users", `id=eq.${auth.uid}`, USER_SELECT_FIELDS);
    if (!u) return json({ error: "USER_NOT_FOUND" }, 404, origin);
    return json(mapUser(u), 200, origin);
  }

  return json({ error: "Not found" }, 404, origin);
}
