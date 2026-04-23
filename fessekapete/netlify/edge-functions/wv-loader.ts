import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const SGTM_URL = Deno.env.get("WV_SGTM_URL");
  const url = new URL(request.url);
  const target = `${SGTM_URL}/gtag/js${url.search}`;
  
  const response = await fetch(target);
  let js = await response.text();

  js = js.replace(/www\.google-analytics\.com/g, "www.stratads.fr/assets/lib/web-vitals/ga");
  js = js.replace(/\/g\/collect/g, "/assets/lib/web-vitals/core/c");

  return new Response(js, { headers: { "Content-Type": "application/javascript" } });
}