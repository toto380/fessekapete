// Dans /netlify/edge-functions/wv-proxy.ts

export default async function (request: Request, context: Context) {
  const incoming = new URL(request.url);
  const subPath = incoming.pathname.replace("/assets/lib/web-vitals", "");

  // Si le fichier est un composant "core", on le demande directement à Google
  // car sGTM ne l'a souvent pas par défaut.
  const targetHost = subPath.includes("/core/") 
    ? "https://www.googletagmanager.com" 
    : Deno.env.get("WV_SGTM_URL");

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
