import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const SGTM_URL = Deno.env.get("WV_SGTM_URL") || "https://metrics.stratads.fr";
  const MEASUREMENT_ID = Deno.env.get("WV_MEASUREMENT_ID") || "G-S30RM9RR91";

  const incoming = new URL(request.url);
  const target = `${SGTM_URL.replace(/\/$/, "")}/g/collect${incoming.search}`;

  // 1. Headers à relayer vers sGTM
  const headers = new Headers();
  const forward = ["content-type", "user-agent", "accept", "accept-language", "cookie", "referer"];
  for (const h of forward) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }

  // 2. INJECTION DU DEBUG HEADER
  // On récupère le header envoyé par le navigateur (via ton script stealth)
  const previewHeader = request.headers.get("x-gtm-server-preview");
  if (previewHeader) {
    headers.set("X-Gtm-Server-Preview", previewHeader);
  }

  // 3. IP Réelle (crucial pour GA4)
  const clientIP = (context as any).ip || request.headers.get("x-nf-client-connection-ip") || "";
  if (clientIP) headers.set("X-Forwarded-For", clientIP);

  // 4. Forward vers sGTM
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: headers,
      body: request.method === "GET" || request.method === "HEAD" ? null : request.body,
    });
  } catch {
    return new Response("", { status: 204 });
  }

  // ... (le reste de ton code pour les cookies _ga reste inchangé)
  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers, // On relaie aussi les headers de retour (pour le debug)
  });
}
