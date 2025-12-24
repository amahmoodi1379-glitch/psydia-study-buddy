// worker/src/lib/utils.ts

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

export function addDaysISO(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function clampInt(v: any, min: number, max: number) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function clampEF(ef: number) {
  return Math.max(1.3, Math.min(3.0, ef));
}

export function pct(x: number, total: number) {
  if (!total) return 0;
  return Math.round((x / total) * 100);
}

export function shuffle(arr: any[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickSome(arr: any[], n: number) {
  return arr.slice(0, Math.max(0, n));
}

export function computeStatusLabel({ dueCount, weakCount, newCount, totalAnswered, accuracy }: any) {
  if (totalAnswered < 3) return "beginner";
  if ((accuracy ?? 0) >= 85 && weakCount === 0 && dueCount <= 3) return "mastered";
  if ((accuracy ?? 0) >= 70) return "almost";
  return "in_progress";
}
