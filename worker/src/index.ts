import { Env } from "./lib/db";
import { corsHeaders, json } from "./lib/utils";
import { handleAuth } from "./routes/auth";
import { handleContent } from "./routes/content";
import { handleSession } from "./routes/session";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get("Origin") || "*";
    
    // Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    try {
      const url = new URL(request.url);
      const { pathname } = url;

      // فقط روت‌های API را پردازش کن
      if (!pathname.startsWith("/api/app/v1/")) {
        return json({ error: "Not found" }, 404, origin);
      }

      // هدایت به ماژول‌های مختلف بر اساس شروع مسیر
      if (pathname.startsWith("/api/app/v1/auth")) {
        return handleAuth(request, env, pathname, origin);
      }
      
      if (pathname.startsWith("/api/app/v1/subjects") || 
          pathname.startsWith("/api/app/v1/topics") || 
          pathname.startsWith("/api/app/v1/subtopics")) {
        return handleContent(request, env, pathname, url.searchParams, origin);
      }

      if (pathname.startsWith("/api/app/v1/sessions") || 
          pathname.startsWith("/api/app/v1/answers")) {
        return handleSession(request, env, pathname, origin);
      }

      // ... بقیه هندلرها

      return json({ error: "Not found" }, 404, origin);

    } catch (e: any) {
      console.error("FATAL:", e.message);
      return json({ error: "INTERNAL_ERROR", details: e.message }, 500, origin);
    }
  },
};
