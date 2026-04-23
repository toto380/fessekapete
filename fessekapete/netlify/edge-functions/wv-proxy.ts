// netlify/edge-functions/wv-proxy.ts
import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const incoming = new URL(request.url);
  const subPath = incoming.pathname.replace("/assets/lib/web-vitals", "");
  
  // FORCE GOOGLE pour les fichiers /core/ car sGTM ne les a pas toujours
  const targetHost = subPath.includes("/core/") 
    ? "https://www.googletagmanager.com" 
    : "https://metrics.stratads.fr";

  const target = `${targetHost}${subPath}${incoming.search}`;

  try {
    const upstream = await fetch(target, {
      headers: { "User-Agent": request.headers.get("User-Agent") ?? "" }
    });

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new Response("// proxy error", { status: 502 });
  }
}
