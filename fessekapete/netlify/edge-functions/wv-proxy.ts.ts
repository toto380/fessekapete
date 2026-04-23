import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const SGTM_URL = Deno.env.get("WV_SGTM_URL");
  const incoming = new URL(request.url);
  
  // On récupère tout ce qui vient après /assets/lib/web-vitals
  const path = incoming.pathname.replace("/assets/lib/web-vitals", "");
  
  // On redirige vers sGTM (qui lui sait où trouver t.js ou les autres modules)
  const target = `${SGTM_URL}${path}${incoming.search}`;

  const upstream = await fetch(target, {
    headers: { "User-Agent": request.headers.get("User-Agent") || "" }
  });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/javascript",
      "Cache-Control": "public, max-age=3600"
    }
  });
}