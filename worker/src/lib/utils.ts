export function json(data: any, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function safeJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export function nowSec() {
  return Math.floor(Date.now() / 1000);
}

// بقیه توابع کوچک مثل clampInt, shuffle, pickSome را اینجا بگذارید
export function clampInt(v: any, min: number, max: number) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
