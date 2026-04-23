import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const SGTM_URL = Deno.env.get("WV_SGTM_URL");
  const WEB_ID = Deno.env.get("WV_GTM_WEB_ID");

  if (!SGTM_URL || !WEB_ID) {
    return new Response("// config missing", {
      status: 500,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  // Propage tous les query params entrants (id, gtg_health, etc.)
  const incoming = new URL(request.url);
  const qs = new URLSearchParams(incoming.search);
  if (!qs.has("id")) qs.set("id", WEB_ID);

  const target = `${SGTM_URL}/gtm.js?${qs.toString()}`;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers: {
        "User-Agent": request.headers.get("User-Agent") ?? "",
      },
    });
  } catch {
    return new Response("// upstream fetch failed", {
      status: 502,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  if (!upstream.ok) {
    return new Response(`// upstream error ${upstream.status}`, {
      status: upstream.status,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  let js = await upstream.text();

  // ============================================================
  // RÉÉCRITURES — l'ordre est CRITIQUE : du plus spécifique au plus générique
  // ============================================================

  // 1) URLs absolues complètes avec path spécifique → path first-party
  js = js.replaceAll("https://www.googletagmanager.com/gtm.js",     "/assets/lib/web-vitals/core/t.js");
  js = js.replaceAll("https://www.googletagmanager.com/gtag/js",    "/assets/lib/web-vitals/core/b.js");
  js = js.replaceAll("https://www.google-analytics.com/g/collect",  "/assets/lib/web-vitals/core/c");
  js = js.replaceAll("https://www.google-analytics.com/g/s/collect","/assets/lib/web-vitals/core/c");
  js = js.replaceAll("https://region1.google-analytics.com/g/collect", "/assets/lib/web-vitals/core/c");
  js = js.replaceAll("https://region1.google-analytics.com",        "/assets/lib/web-vitals/a/r1");
  js = js.replaceAll("https://analytics.google.com",                "/assets/lib/web-vitals/a");

  // 2) Variantes protocol-relative (//)
  js = js.replaceAll("//www.googletagmanager.com/gtm.js",     "/assets/lib/web-vitals/core/t.js");
  js = js.replaceAll("//www.googletagmanager.com/gtag/js",    "/assets/lib/web-vitals/core/b.js");
  js = js.replaceAll("//www.google-analytics.com/g/collect",  "/assets/lib/web-vitals/core/c");

  // 3) Domaines nus → chaîne vide (pour que "host + path" devienne juste "path", same-origin)
  js = js.replaceAll("https://www.googletagmanager.com", "");
  js = js.replaceAll("https://www.google-analytics.com", "");
  js = js.replaceAll("//www.googletagmanager.com",       "");
  js = js.replaceAll("//www.google-analytics.com",       "");

  // 4) Hostname seul (sans protocole) → notre domaine first-party
  js = js.replaceAll("www.googletagmanager.com", "www.stratads.fr");
  js = js.replaceAll("www.google-analytics.com", "www.stratads.fr");

  // ⚠️ NOTE : on NE fait PAS de replaceAll("/gtag/js", ...) ni ("/gtm.js", ...)
  // parce que ça provoquait le bug du double-path sur le transport_url.

  return new Response(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
}
