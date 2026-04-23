import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const incoming = new URL(request.url);
  const PROXY_PATH = "/assets/lib/web-vitals";
  
  // 1. Extraction du sous-chemin (ex: /core/t.js)
  let subPath = incoming.pathname.replace(PROXY_PATH, "");
  if (!subPath.startsWith("/")) subPath = "/" + subPath;

  // Récupération de l'URL sGTM propre
  const SGTM_URL = Deno.env.get("WV_SGTM_URL")?.replace(/\/$/, "") || "https://metrics.stratads.fr";

  // 2. Préparation des headers pour le transfert
  const headers = new Headers();
  const forwardHeaders = ["user-agent", "accept", "accept-language", "cookie", "referer"];

  for (const name of forwardHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  // 3. INJECTION DU TAG DE PREVIEW EN DUR (Mode Debug Forcé)
  // On utilise votre valeur spécifique pour que sGTM affiche les hits dans la console
  headers.set("X-Gtm-Server-Preview", "ZW52LTV8N0txdUxsMUE2TUFmT3RlRlhpQkJsQXwxOWRiYjllNGM3MjYxNTQ4OTEwODg=");

  // 4. Exécution du proxy vers sGTM
  try {
    const target = `${SGTM_URL}${subPath}${incoming.search}`;
    const upstream = await fetch(target, {
      method: request.method,
      headers: headers,
      // On passe le body pour les requêtes de données (POST)
      body: ["POST", "PUT"].includes(request.method) ? request.body : null,
    });

    if (upstream.ok) {
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type": upstream.headers.get("content-type") || "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
          // On renvoie le header de preview pour maintenir la session de debug
          "X-Gtm-Server-Preview": upstream.headers.get("x-gtm-server-preview") || ""
        }
      });
    }
  } catch (e) {
    console.error(`Proxy error: ${e.message}`);
  }

  // 5. FALLBACK STEALTH (Camouflage en cas d'erreur ou 404)
  // On renvoie un code 200 avec un script vide pour éviter les erreurs console
  return new Response("// Stealth module bypass - Active", {
    status: 200,
    headers: { 
      "Content-Type": "application/javascript; charset=utf-8",
      "X-Stealth-Mode": "active"
    }
  });
}
