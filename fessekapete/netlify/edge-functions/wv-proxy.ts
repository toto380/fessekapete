import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const incoming = new URL(request.url);
  const PROXY_PATH = "/assets/lib/web-vitals";
  
  // 1. Extraction du chemin (ex: /core/t.js)
  let subPath = incoming.pathname.replace(PROXY_PATH, "");
  if (!subPath.startsWith("/")) subPath = "/" + subPath;

  const SGTM_URL = Deno.env.get("WV_SGTM_URL") || "https://metrics.stratads.fr";

  // 2. Liste des cibles possibles (sGTM puis Google GTM en secours)
  const targets = [
    `${SGTM_URL.replace(/\/$/, "")}${subPath}${incoming.search}`,
    `https://www.googletagmanager.com${subPath}${incoming.search}`
  ];

  for (const target of targets) {
    try {
      const response = await fetch(target, {
        headers: { 
          "User-Agent": request.headers.get("User-Agent") || "",
          "Accept": "*/*"
        }
      });

      if (response.ok) {
        // 3. Succès : On récupère le contenu et on force le type MIME
        const body = await response.arrayBuffer();
        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    } catch (e) {
      // On ignore l'erreur et on tente la cible suivante
    }
  }

  // 4. Si aucune cible ne répond
  return new Response("// Stealth Proxy: File not found", { 
    status: 404,
    headers: { "Content-Type": "application/javascript" } 
  });
}
