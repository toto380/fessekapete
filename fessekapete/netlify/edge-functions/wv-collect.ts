import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const SGTM_URL = Deno.env.get("WV_SGTM_URL");
  const url = new URL(request.url);
  const target = `${SGTM_URL}/g/collect${url.search}`;

  const proxyRequest = new Request(target, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  return await fetch(proxyRequest);
}