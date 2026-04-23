import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const FIRST_PARTY_HOST = 'www.stratads.fr';
  const FIRST_PARTY = 'https://' + FIRST_PARTY_HOST;
  const PROXY_PATH = '/assets/lib/web-vitals';
  const SGTM_URL = Deno.env.get("WV_SGTM_URL")?.replace(/\/$/, ""); // Nettoyage slash

  if (!SGTM_URL) {
    return new Response("// config missing", {
      status: 500,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const incoming = new URL(request.url);
  // On s'assure que la cible sur sGTM est le vrai chemin attendu par Google
  const target = `${SGTM_URL}/gtag/js${incoming.search}`;

  // 1. Préparation des headers complets pour sGTM
  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    headers.set(key, value);
  }

  // 2. Injection du Header de Debug (ton tag manuel)
  headers.set("X-Gtm-Server-Preview", "ZW52LTV8N0txdUxsMUE2TUFmT3RlRlhpQkJsQXwxOWRiYjllNGM3MjYxNTQ4OTEwODg=");

  // 3. Forcer l'IP réelle du client pour la géolocalisation sGTM
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

  // 4. Remplacements pour le camouflage (Stealth)
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
