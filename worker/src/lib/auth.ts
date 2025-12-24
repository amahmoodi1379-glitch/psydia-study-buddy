// worker/src/lib/auth.ts
import { Env } from "./db";

// --- JWT Helpers ---

export async function signJwt(payload: any, secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;
  const sig = await hmacSha256Base64Url(secret, data);
  return `${data}.${sig}`;
}

export async function verifyJwt(token: string, secret: string) {
  const parts = (token || "").split(".");
  if (parts.length !== 3) return { ok: false, error: "BAD_TOKEN" };
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const expected = await hmacSha256Base64Url(secret, data);
  if (!timingSafeEqual(expected, s)) return { ok: false, error: "BAD_SIGNATURE" };
  const payload = JSON.parse(fromBase64url(p));
  if (payload.exp && (Math.floor(Date.now() / 1000)) > payload.exp) return { ok: false, error: "TOKEN_EXPIRED" };
  return { ok: true, payload };
}

// --- Telegram Helpers ---

export async function verifyTelegramInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, error: "HASH_MISSING" };
  params.delete("hash");

  const entries = [];
  for (const [k, v] of params.entries()) entries.push([k, v]);
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  const secretKey = await hmacSha256Raw(new TextEncoder().encode("WebAppData"), botToken);
  const checkHash = await hmacSha256Hex(new Uint8Array(secretKey), dataCheckString);

  if (!timingSafeEqual(checkHash, hash.toLowerCase())) return { ok: false, error: "HASH_INVALID" };

  const userJson = params.get("user");
  const authDate = parseInt(params.get("auth_date") || "0", 10) || null;
  let user = null;
  try { user = userJson ? JSON.parse(userJson) : null; } catch { user = null; }

  return { ok: true, user, authDate };
}

// --- Crypto Utils ---

function base64url(str: string) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64url(b64url: string) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
  const str = decodeURIComponent(escape(atob(b64)));
  return str;
}

async function hmacSha256Base64Url(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const bytes = new Uint8Array(sig);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return b64;
}

async function hmacSha256Raw(keyBytes: Uint8Array, messageStr: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(messageStr));
}

async function hmacSha256Hex(keyBytes: Uint8Array, messageStr: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(messageStr));
  const bytes = new Uint8Array(sig);
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// --- Exported Middleware ---

export async function requireAuth(request: Request, env: Env) {
  const h = request.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return { ok: false, error: "NO_TOKEN" };
  const res = await verifyJwt(m[1], env.APP_JWT_SECRET);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, uid: res.payload.uid, tid: res.payload.tid };
}
