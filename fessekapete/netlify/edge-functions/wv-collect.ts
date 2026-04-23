import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const SGTM_URL = Deno.env.get("WV_SGTM_URL")?.replace(/\/$/, "") || "https://metrics.stratads.fr";
  const MEASUREMENT_ID = Deno.env.get("WV_MEASUREMENT_ID") || "G-S30RM9RR91";

  const incoming = new URL(request.url);
  // On s'assure que la cible est bien le point de collecte sGTM
  const target = `${SGTM_URL}/g/collect${incoming.search}`;

  // 1. Headers à relayer vers sGTM
  const headers = new Headers();
  const forward = ["content-type", "user-agent", "accept", "accept-language", "cookie", "referer"];
  for (const h of forward) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }

  // 2. INJECTION DU DEBUG HEADER EN DUR
  // On force ton tag de preview pour que chaque événement apparaisse dans la console sGTM
  headers.set("X-Gtm-Server-Preview", "ZW52LTV8N0txdUxsMUE2TUFmT3RlRlhpQkJsQXwxOWRiYjllNGM3MjYxNTQ4OTEwODg=");

  // 3. IP Réelle (Crucial pour éviter l'erreur de région et pour GA4)
  const clientIP = (context as any).ip || request.headers.get("x-nf-client-connection-ip") || "";
  if (clientIP) {
    headers.set("X-Forwarded-For", clientIP);
  }

  // 4. Forward vers sGTM
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: headers,
      // On gère le body pour les requêtes POST (événements GA4)
      body: request.method === "GET" || request.method === "HEAD" ? null : request.body,
    });
  } catch (e) {
    console.error(`Collect fetch error: ${e.message}`);
    return new Response("", { status: 204 });
  }

  // 5. Retour de la réponse sGTM (inclut les cookies de debug en retour)
  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}
