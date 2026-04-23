import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const FIRST_PARTY_HOST = 'www.stratads.fr';
  const FIRST_PARTY = 'https://' + FIRST_PARTY_HOST;
  const PROXY_PATH = '/assets/lib/web-vitals';
  const SGTM_URL = Deno.env.get("WV_SGTM_URL")?.replace(/\/$/, "");
  const WEB_ID = Deno.env.get("WV_GTM_WEB_ID") || "GTM-N5K4N265";

  if (!SGTM_URL) return new Response("// config missing", { status: 500 });

  const incoming = new URL(request.url);
  const qs = new URLSearchParams(incoming.search);
  if (!qs.has("id")) qs.set("id", WEB_ID);
  
  const target = `${SGTM_URL}/gtm.js?${qs.toString()}`;

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    headers.set(key, value);
  }
  // CRUCIAL: Supprimer le host pour éviter la 400
  headers.delete("host");
  headers.set("X-Gtm-Server-Preview", "ZW52LTV8N0txdUxsMUE2TUFmT3RlRlhpQkJsQXwxOWRiYjllNGM3MjYxNTQ4OTEwODg=");

  const clientIP = (context as any).ip || request.headers.get("x-nf-client-connection-ip") || "";
  if (clientIP) headers.set("X-Forwarded-For", clientIP);

  try {
    const upstream = await fetch(target, { method: request.method, headers });
    if (!upstream.ok) return new Response(`// upstream error ${upstream.status}`, { status: upstream.status });

    let body = await upstream.text();
    body = body.replace(/https?:\/\/(www\.)?googletagmanager\.com/gi, FIRST_PARTY + PROXY_PATH)
                .replace(/https?:\/\/(www\.|region1\.|ssl\.)?google-analytics\.com/gi, FIRST_PARTY + PROXY_PATH)
                .replace(/"www\.googletagmanager\.com"/g, '"' + FIRST_PARTY_HOST + '"');

    return new Response(body, {
      headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=1800" }
    });
  } catch { return new Response("// fetch failed", { status: 502 }); }
}
