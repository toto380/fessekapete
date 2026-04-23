import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const SGTM_URL = Deno.env.get("WV_SGTM_URL");
  const WEB_ID = Deno.env.get("WV_GTM_WEB_ID");

  if (!SGTM_URL || !WEB_ID) return new Response("Config missing", { status: 500 });

  const target = `${SGTM_URL}/gtm.js?id=${WEB_ID}`;
  const response = await fetch(target);
  let js = await response.text();

  // RÉÉCRITURES GHOST
  js = js.replace(/www\.googletagmanager\.com\/gtag\/js/g, "www.stratads.fr/assets/lib/web-vitals/core/b.js");
  js = js.replace(/www\.googletagmanager\.com\/gtm\.js/g, "www.stratads.fr/assets/lib/web-vitals/core/t.js");
  js = js.replace(/\/gtag\/js/g, "/assets/lib/web-vitals/core/b.js");
  js = js.replace(/\/gtm\.js/g, "/assets/lib/web-vitals/core/t.js");
  js = js.replace(/\.google-analytics\.com/g, ".stratads.fr/assets/lib/web-vitals/ga");

  return new Response(js, {
    headers: { "Content-Type": "application/javascript", "Cache-Control": "public, max-age=3600" },
  });
}