import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const incoming = new URL(request.url);
  const PROXY_PATH = "/assets/lib/web-vitals";
  let subPath = incoming.pathname.replace(PROXY_PATH, "");
  if (!subPath.startsWith("/")) subPath = "/" + subPath;

  const SGTM_URL = Deno.env.get("WV_GTM_SERVER_URL")?.replace(/\/$/, "") || "https://metrics.stratads.fr";

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    headers.set(key, value);
  }
  headers.delete("host");
  headers.set("X-Gtm-Server-Preview", "ZW52LTV8N0txdUxsMUE2TUFmT3RlRlhpQkJsQXwxOWRiYjllNGM3MjYxNTQ4OTEwODg=");

  try {
    const target = `${SGTM_URL}${subPath}${incoming.search}`;
    const upstream = await fetch(target, {
      method: request.method,
      headers: headers,
      body: ["POST", "PUT"].includes(request.method) ? request.body : null,
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: upstream.headers
    });
  } catch {
    return new Response("// fallback", { status: 200, headers: { "Content-Type": "application/javascript" } });
  }
}
