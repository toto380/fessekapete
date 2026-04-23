import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const FIRST_PARTY_HOST = 'www.stratads.fr';
  const FIRST_PARTY = 'https://' + FIRST_PARTY_HOST;
  const PROXY_PATH = '/assets/lib/web-vitals';
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

  let body = await upstream.text();

  body = body
  // URLs complètes
  .replace(/https?:\/\/(www\.)?googletagmanager\.com/gi, FIRST_PARTY + PROXY_PATH)
  .replace(/https?:\/\/(www\.|region1\.|ssl\.)?google-analytics\.com/gi, FIRST_PARTY + PROXY_PATH)
  .replace(/https?:\/\/analytics\.google\.com/gi, FIRST_PARTY + PROXY_PATH)
  .replace(/https?:\/\/stats\.g\.doubleclick\.net/gi, FIRST_PARTY + PROXY_PATH)
  // Protocol-relative
  .replace(/\/\/(www\.)?googletagmanager\.com/gi, FIRST_PARTY + PROXY_PATH)
  .replace(/\/\/(www\.|region1\.|ssl\.)?google-analytics\.com/gi, FIRST_PARTY + PROXY_PATH)
  // Hostnames nus entre quotes
  .replace(/"www\.googletagmanager\.com"/g, '"' + FIRST_PARTY_HOST + '"')
  .replace(/'www\.googletagmanager\.com'/g, "'" + FIRST_PARTY_HOST + "'")
  .replace(/"www\.google-analytics\.com"/g, '"' + FIRST_PARTY_HOST + '"')
  .replace(/'www\.google-analytics\.com'/g, "'" + FIRST_PARTY_HOST + "'");

  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
}