import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const SGTM_URL = Deno.env.get("WV_SGTM_URL")?.replace(/\/$/, "") || "https://metrics.stratads.fr";
  const incoming = new URL(request.url);
  const target = `${SGTM_URL}/g/collect${incoming.search}`;

  const headers = new Headers();
  const forward = ["content-type", "user-agent", "accept", "accept-language", "cookie", "referer"];
  for (const h of forward) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.delete("host");
  headers.set("X-Gtm-Server-Preview", "ZW52LTV8N0txdUxsMUE2TUFmT3RlRlhpQkJsQXwxOWRiYjllNGM3MjYxNTQ4OTEwODg=");

  const clientIP = (context as any).ip || request.headers.get("x-nf-client-connection-ip") || "";
  if (clientIP) headers.set("X-Forwarded-For", clientIP);

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: headers,
      body: ["POST", "PUT"].includes(request.method) ? request.body : null,
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: upstream.headers,
    });
  } catch { return new Response("", { status: 204 }); }
}
