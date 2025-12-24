import { Env } from "./lib/db";
import { corsHeaders, json } from "./lib/utils";
import { handleAuth } from "./routes/auth";
import { handleContent } from "./routes/content";
import { handleSession } from "./routes/session";
import { handleStats } from "./routes/stats";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get("Origin") || "*";
    
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      const url = new URL(request.url);
      const { pathname, searchParams } = url;

      if (pathname.startsWith("/api/app/v1/auth") || pathname.startsWith("/api/app/v1/user")) {
        return handleAuth(request, env, pathname, origin);
      }
      
      if (pathname.startsWith("/api/app/v1/subjects") || pathname.startsWith("/api/app/v1/topics") || pathname.startsWith("/api/app/v1/subtopics")) {
        return handleContent(request, env, pathname, searchParams, origin);
      }

      if (pathname.startsWith("/api/app/v1/sessions") || pathname.startsWith("/api/app/v1/answers") || pathname.startsWith("/api/app/v1/bookmarks") || pathname.startsWith("/api/app/v1/reports")) {
        return handleSession(request, env, pathname, origin);
      }

      if (pathname.startsWith("/api/app/v1/stats")) {
        return handleStats(request, env, pathname, origin);
      }

      return json({ error: "Not found" }, 404, origin);
    } catch (e: any) {
      return json({ error: "INTERNAL_ERROR", details: e.message }, 500, origin);
    }
  },
};
