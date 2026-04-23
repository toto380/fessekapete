import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const SGTM_URL = Deno.env.get("WV_SGTM_URL");
  if (!SGTM_URL) {
    return new Response("// config missing", {
      status: 500,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const incoming = new URL(request.url);
  const target = `${SGTM_URL}/gtag/js${incoming.search}`;

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
  // Réécritures — même logique que wv-tm.ts, l'ordre est critique
  // ============================================================

  // 1) URLs absolues complètes → path first-party
  js = js.replaceAll("https://www.googletagmanager.com/gtm.js",     "/assets/lib/web-vitals/core/t.js");
  js = js.replaceAll("https://www.googletagmanager.com/gtag/js",    "/assets/lib/web-vitals/core/b.js");
  js = js.replaceAll("https://www.google-analytics.com/g/collect",  "/assets/lib/web-vitals/core/c");
  js = js.replaceAll("https://www.google-analytics.com/g/s/collect","/assets/lib/web-vitals/core/c");
  js = js.replaceAll("https://region1.google-analytics.com/g/collect", "/assets/lib/web-vitals/core/c");
  js = js.replaceAll("https://region1.google-analytics.com",        "/assets/lib/web-vitals/a/r1");
  js = js.replaceAll("https://analytics.google.com",                "/assets/lib/web-vitals/a");

  // 2) Protocol-relative variants
  js = js.replaceAll("//www.googletagmanager.com/gtm.js",     "/assets/lib/web-vitals/core/t.js");
  js = js.replaceAll("//www.googletagmanager.com/gtag/js",    "/assets/lib/web-vitals/core/b.js");
  js = js.replaceAll("//www.google-analytics.com/g/collect",  "/assets/lib/web-vitals/core/c");

  // 3) Domaines nus → chaîne vide (pour que "host + path" devienne "path", same-origin)
  js = js.replaceAll("https://www.googletagmanager.com", "");
  js = js.replaceAll("https://www.google-analytics.com", "");
  js = js.replaceAll("//www.googletagmanager.com",       "");
  js = js.replaceAll("//www.google-analytics.com",       "");

  // 4) Hostname sans protocole → notre domaine first-party
  js = js.replaceAll("www.googletagmanager.com", "www.stratads.fr");
  js = js.replaceAll("www.google-analytics.com", "www.stratads.fr");
  // 5) Fallback — domaines nus sans le préfixe www.
  //    Pour les cas où le code sGTM fragmente "www." + "googletagmanager.com"
  js = js.replaceAll("googletagmanager.com", "stratads.fr");
  js = js.replaceAll("google-analytics.com", "stratads.fr");
  return new Response(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
}
