import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const incoming = new URL(request.url);
  const PROXY_PATH = "/assets/lib/web-vitals";
  
  // 1. Extraction du sous-chemin
  let subPath = incoming.pathname.replace(PROXY_PATH, "");
  if (!subPath.startsWith("/")) subPath = "/" + subPath;

  const SGTM_URL = Deno.env.get("WV_SGTM_URL")?.replace(/\/$/, "") || "https://metrics.stratads.fr";

  // 2. Préparation des headers
  const headers = new Headers();
  const forwardHeaders = ["user-agent", "accept", "accept-language", "cookie", "referer"];

  for (const name of forwardHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  // 3. INJECTION DU TAG DE PREVIEW EN DUR
  // On utilise la valeur que tu as fournie pour forcer le mode Debug
  headers.set("X-Gtm-Server-Preview", "ZW52LTV8N0txdUxsMUE2TUFmT3RlRlhpQkJsQXwxOWRiYjllNGM3MjYxNTQ4OTEwODg=");

  // 4. Exécution du proxy
  try {
    const target = `${SGTM_URL}${subPath}${incoming.search}`;
    const upstream = await fetch(target, {
      method: request.method,
      headers: headers,
      body: ["POST", "PUT"].includes(request.method) ? request.body : null,
    });

    if (upstream.ok) {
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type": upstream.headers.get("content-type") || "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
          "X-Gtm-Server-Preview": upstream.headers.get("x-gtm-server-preview") || ""
        }
      });
    }
  } catch (e) {
    console.error(`Proxy error: ${e.message}`);
  }

  // 5. FALLBACK STEALTH (Si 404 ou erreur)
  return new Response("// Stealth module bypass", {
    status: 200,
    headers: { "Content-Type": "application/javascript; charset=utf-8" }
  });
}
