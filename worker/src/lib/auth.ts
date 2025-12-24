import { Env } from "./db";

// توابع signJwt, verifyJwt, verifyTelegramInitData را دقیقاً از کد قبلی اینجا بیاورید.
// به دلیل طولانی بودن کد تکرار نمیکنم، اما دقیقا همان منطق verifyTelegramInitData اینجا باشد.

export async function requireAuth(request: Request, env: Env) {
  const h = request.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return { ok: false, error: "NO_TOKEN" };
  // فرض بر این است که verifyJwt در همین فایل اکسپورت شده است
  const res = await verifyJwt(m[1], env.APP_JWT_SECRET);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, uid: res.payload.uid, tid: res.payload.tid };
}
