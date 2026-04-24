import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const SGTM_URL = Deno.env.get("WV_GTM_SERVER_URL")?.replace(/\/$/, "");
  const MEASUREMENT_ID = Deno.env.get("WV_MEASUREMENT_ID") || "G-S30RM9RR91";

  if (!SGTM_URL) return new Response("// config missing", { status: 500 });

  const incoming = new URL(request.url);
  const qs = new URLSearchParams(incoming.search);
  if (!qs.has("id")) qs.set("id", MEASUREMENT_ID);
  
  // On pointe vers l'URL réelle de Google via ton sGTM
  const target = `${SGTM_URL}/gtag/js?${qs.toString()}`;

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    headers.set(key, value);
  }
  headers.delete("host"); // Obligatoire pour éviter la 400/500

  try {
    const upstream = await fetch(target, { method: request.method, headers });
    let body = await upstream.text();

    // On remplace les domaines Google par ton domaine pour rester en First-Party
    body = body.replace(/https?:\/\/(www\.)?googletagmanager\.com/gi, '/assets/lib/web-vitals')
                .replace(/https?:\/\/(www\.|region1\.|ssl\.)?google-analytics\.com/gi, '/assets/lib/web-vitals');

    return new Response(body, {
      headers: { "Content-Type": "application/javascript; charset=utf-8" }
    });
  } catch (e) {
    return new Response(`// Error: ${e.message}`, { status: 502 });
  }
}
