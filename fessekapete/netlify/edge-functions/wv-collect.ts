import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const SGTM_URL = Deno.env.get("WV_SGTM_URL");
  const COOKIE_DOMAIN = Deno.env.get("WV_COOKIE_DOMAIN") ?? ".stratads.fr";
  const MEASUREMENT_ID = Deno.env.get("WV_MEASUREMENT_ID") ?? "G-S30RM9RR91";

  if (!SGTM_URL) {
    return new Response("", { status: 204 });
  }

  const incoming = new URL(request.url);
  const target = `${SGTM_URL}/g/collect${incoming.search}`;

  // Headers à relayer vers sGTM
  const headers = new Headers();
  const forward = ["content-type", "user-agent", "accept", "accept-language", "cookie", "referer"];
  for (const h of forward) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }

  // Propage l'IP réelle du visiteur (crucial pour GA4)
  const clientIP =
    (context as any).ip ??
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for") ??
    "";
  if (clientIP) headers.set("X-Forwarded-For", clientIP);

  // Forward vers sGTM
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? null : request.body,
    });
  } catch {
    return new Response("", { status: 204 });
  }

  // Prépare la réponse au client
  const responseHeaders = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) responseHeaders.set("Content-Type", ct);

  // Cookies first-party (résistants à Safari ITP)
  const cookies = parseCookies(request.headers.get("cookie") ?? "");
  const now = Math.floor(Date.now() / 1000);

  if (!cookies["_ga"]) {
    const clientId = Math.floor(Math.random() * 900_000_000) + 100_000_000;
    const gaValue = `GA1.1.${clientId}.${now}`;
    responseHeaders.append("Set-Cookie", buildCookie("_ga", gaValue, COOKIE_DOMAIN));
  }

  const sessionCookieName = "_ga_" + MEASUREMENT_ID.replace(/^G-/, "");
  if (!cookies[sessionCookieName]) {
    const sessionValue = `GS1.1.${now}.1.0.${now}.0.0.0`;
    responseHeaders.append("Set-Cookie", buildCookie(sessionCookieName, sessionValue, COOKIE_DOMAIN));
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

function buildCookie(name: string, value: string, domain: string): string {
  return `${name}=${value}; Domain=${domain}; Path=/; Max-Age=63072000; Secure; SameSite=Lax`;
}
