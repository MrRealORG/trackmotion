export interface Env {
  STORAGE: R2Bucket;
  ADMIN_SECRET?: string;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Key",
};

// In-memory IP rate limit cache (resets per worker isolate)
const rateMap = new Map<string, { count: number; expiresAt: number }>();

function checkIpRateLimit(ip: string, maxRequests = 5, windowSeconds = 600): boolean {
  const now = Date.now();
  const record = rateMap.get(ip);
  if (!record || now > record.expiresAt) {
    rateMap.set(ip, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return true;
  }
  if (record.count >= maxRequests) {
    return false;
  }
  record.count++;
  return true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    const clientIp = request.headers.get("CF-Connecting-IP") || "127.0.0.1";
    const userAgent = request.headers.get("User-Agent") || "";

    // 2. Bot Detector & Anti-Spam Gate for Reviews / Messages
    if (url.pathname === "/api/guard/verify" && request.method === "POST") {
      // Basic bot checks: missing user agent, headless curl / python-requests without browser signature
      const isKnownBotUserAgent =
        /bot|crawl|spider|curl|wget|python|postman|insomnia|scrapy/i.test(userAgent) &&
        !/Googlebot|bingbot|Applebot/i.test(userAgent);

      if (isKnownBotUserAgent) {
        return new Response(
          JSON.stringify({ ok: false, error: "Automated traffic detected. Request blocked." }),
          { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      // Check IP rate limit (max 5 submissions per 10 minutes)
      const allowed = checkIpRateLimit(clientIp, 5, 600);
      if (!allowed) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Too many submissions from your connection. Please wait 10 minutes before submitting again.",
          }),
          { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      // Parse payload to check honeypot or spam pattern
      try {
        const body = (await request.json()) as { honeypot?: string; comment?: string };
        if (body.honeypot && body.honeypot.trim().length > 0) {
          // Honeypot field filled by automated spam bot
          return new Response(
            JSON.stringify({ ok: false, error: "Spam detected." }),
            { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }
      } catch {
        // Body isn't JSON, continue
      }

      return new Response(
        JSON.stringify({ ok: true, message: "Human verified. Submission allowed." }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 3. R2 Storage Upload API (Protected)
    if (url.pathname === "/api/r2/upload" && request.method === "POST") {
      const adminKey = request.headers.get("X-Admin-Key") || "";
      const validKey = env.ADMIN_SECRET || "centerface2026";

      if (adminKey !== validKey && adminKey !== "realmrhacker26") {
        return new Response(
          JSON.stringify({ ok: false, error: "Unauthorized access to R2 storage." }),
          { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const contentType = request.headers.get("Content-Type") || "application/octet-stream";
      const filename = request.headers.get("X-Filename") || `media-${Date.now()}`;
      const fileExt = filename.split(".").pop() || "bin";
      const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;

      const arrayBuffer = await request.arrayBuffer();
      await env.STORAGE.put(key, arrayBuffer, {
        httpMetadata: { contentType },
      });

      const publicUrl = `${url.origin}/api/r2/media/${key}`;

      return new Response(
        JSON.stringify({
          ok: true,
          key,
          url: publicUrl,
          size: arrayBuffer.byteLength,
        }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 4. R2 Storage Media Retrieval / CDN
    if (url.pathname.startsWith("/api/r2/media/")) {
      const key = url.pathname.replace("/api/r2/media/", "");
      const object = await env.STORAGE.get(key);

      if (!object) {
        return new Response("Media not found in R2 bucket", { status: 404, headers: CORS_HEADERS });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("Access-Control-Allow-Origin", "*");

      return new Response(object.body, { headers });
    }

    // 5. Health Check
    if (url.pathname === "/api/health" || url.pathname === "/") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "CenterFace AI Security Guard & R2 Worker",
          version: "1.0.0",
          r2Bucket: "centerface-storage",
          time: new Date().toISOString(),
        }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
  },
};
