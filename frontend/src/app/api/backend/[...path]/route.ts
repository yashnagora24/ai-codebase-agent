import type { NextRequest } from "next/server";

// Keep the proxy invocation alive through a Render cold start plus one
// slow AI completion.
export const maxDuration = 300;

// Only the endpoints the UI actually uses are reachable through the proxy.
const ALLOWED_ENDPOINTS = new Set([
  "download-repo",
  "scan",
  "read-file",
  "collect",
  "ask-ai",
  "suggest-fix",
  "analyze",
  "analyze-file",
]);

const MAX_BODY_BYTES = 64 * 1024;

function jsonError(detail: string, status: number) {
  return Response.json({ detail }, { status });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const endpoint = path.join("/");

  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return jsonError("Not found.", 404);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return jsonError("Request body is too large.", 413);
  }

  const body = await request.text();

  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return jsonError("Request body is too large.", 413);
  }

  const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");
  const backendKey = process.env.BACKEND_API_KEY;

  if (!backendUrl || !backendKey) {
    return jsonError("Backend is not configured.", 500);
  }

  // Vercel sets x-forwarded-for; use it to give the backend a per-client
  // rate-limit key instead of lumping every user under the proxy IP.
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const clientIp = forwardedFor.split(",")[0].trim() || "unknown";

  try {
    const upstream = await fetch(`${backendUrl}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Backend-Key": backendKey,
        "X-Client-IP": clientIp,
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(280_000),
    });

    if (upstream.status === 401) {
      return jsonError(
        "The backend rejected this server. Check the deployment configuration.",
        502,
      );
    }

    const contentType =
      upstream.headers.get("content-type") ?? "application/json";

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
    };

    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) {
      responseHeaders["Retry-After"] = retryAfter;
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    return jsonError(
      timedOut
        ? "The backend took too long to respond. Please try again."
        : "The backend is starting up or unavailable. Please try again in a moment.",
      timedOut ? 504 : 503,
    );
  }
}
