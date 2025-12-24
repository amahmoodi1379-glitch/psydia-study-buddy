// اینترفیس محیط برای تایپ‌اسکریپت
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

// ... توابع sbInsert, sbPatch, sbCount و غیره را هم اینجا منتقل کنید
