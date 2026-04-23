import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const FIRST_PARTY_HOST = 'www.stratads.fr';
  const FIRST_PARTY = 'https://' + FIRST_PARTY_HOST;
  const PROXY_PATH = '/assets/lib/web-vitals';
  const SGTM_URL = Deno.env.get("WV_SGTM_URL")?.replace(/\/$/, "");
  const WEB_ID = Deno.env.get("WV_GTM_WEB_ID");

  if (!SGTM_URL || !WEB_ID) {
    return new Response("// config missing", {
      status: 500,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  // 1. Préparation de l'URL cible
  const incoming = new URL(request.url);
  const qs = new URLSearchParams(incoming.search);
  if (!qs.has("id")) qs.set("id", WEB_ID);
  const target = `${SGTM_URL}/gtm.js?${qs.toString()}`;

  // 2. Préparation des headers complets (Propagation + Debug)
  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    headers.set(key, value);
  }

  // Injection forcée du header de Debug
  headers.set("X-Gtm-Server-Preview", "ZW52LTV8N0txdUxsMUE2TUFmT3RlRlhpQkJsQXwxOWRiYjllNGM3MjYxNTQ4OTEwODg=");

  // IP réelle pour la géolocalisation
  const clientIP = (context as any).ip || request.headers.get("x-nf-client-connection-ip") || "";
  if (clientIP) {
    headers.set("X-Forwarded-For", clientIP);
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: headers,
    });
  } catch {
    return new Response("// upstream fetch failed", {
      status: 502,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  if (!upstream.ok) {
    return new Response(`// upstream error ${upstream.status}`, {
      status: upstream.status,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  let body = await upstream.text();

  // 3. Remplacements pour le camouflage (Stealth)
  body = body
    .replace(/https?:\/\/(www\.)?googletagmanager\.com/gi, FIRST_PARTY + PROXY_PATH)
    .replace(/https?:\/\/(www\.|region1\.|ssl\.|stats\.)?google-analytics\.com/gi, FIRST_PARTY + PROXY_PATH)
    .replace(/https?:\/\/analytics\.google\.com/gi, FIRST_PARTY + PROXY_PATH)
    .replace(/https?:\/\/stats\.g\.doubleclick\.net/gi, FIRST_PARTY + PROXY_PATH)
    .replace(/\/\/(www\.)?googletagmanager\.com/gi, FIRST_PARTY + PROXY_PATH)
    .replace(/\/\/(www\.|region1\.|ssl\.)?google-analytics\.com/gi, FIRST_PARTY + PROXY_PATH)
    .replace(/"www\.googletagmanager\.com"/g, '"' + FIRST_PARTY_HOST + '"')
    .replace(/'www\.googletagmanager\.com'/g, "'" + FIRST_PARTY_HOST + "'")
    .replace(/"www\.google-analytics\.com"/g, '"' + FIRST_PARTY_HOST + '"')
    .replace(/'www\.google-analytics\.com'/g, "'" + FIRST_PARTY_HOST + "'");

  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
      "X-Gtm-Server-Preview": upstream.headers.get("x-gtm-server-preview") || ""
    },
  });
}
