import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const incoming = new URL(request.url);
  
  // 1. On extrait le sous-chemin proprement
  const proxyPath = "/assets/lib/web-vitals";
  let subPath = incoming.pathname.replace(proxyPath, "");
  
  // 2. Sécurité : on s'assure que subPath commence par un seul /
  if (!subPath.startsWith("/")) subPath = "/" + subPath;

  // 3. Détermination de la cible (Google pour les scripts core, sGTM pour le reste)
  const SGTM_URL = Deno.env.get("WV_SGTM_URL") || "https://metrics.stratads.fr";
  const targetHost = subPath.includes("/core/") 
    ? "https://www.googletagmanager.com" 
    : SGTM_URL;

  // On nettoie les éventuels doubles slashes à la jonction
  const finalTarget = `${targetHost.replace(/\/$/, "")}${subPath}${incoming.search}`;

  try {
    const upstream = await fetch(finalTarget, {
      headers: {
        "User-Agent": request.headers.get("User-Agent") ?? "",
        "Accept": request.headers.get("Accept") ?? "*/*",
      },
    });

    if (!upstream.ok) {
      console.error(`Upstream error ${upstream.status} for ${finalTarget}`);
      // Si sGTM renvoie 404, on tente un dernier fallback sur Google
      if (upstream.status === 404 && targetHost !== "https://www.googletagmanager.com") {
        const fallback = `https://www.googletagmanager.com${subPath}${incoming.search}`;
        const fbRes = await fetch(fallback);
        return fbRes;
      }
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(`// Proxy error: ${e.message}`, { status: 502 });
  }
}
