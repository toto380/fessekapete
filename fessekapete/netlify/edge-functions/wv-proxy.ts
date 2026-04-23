import { Context } from "https://edge.netlify.com";

export default async function (request: Request, context: Context) {
  const incoming = new URL(request.url);
  const subPath = incoming.pathname.replace("/assets/lib/web-vitals", "");
  const SGTM_URL = Deno.env.get("WV_SGTM_URL") || "https://metrics.stratads.fr";

  try {
    // On tente de récupérer le vrai fichier sur ton sGTM
    const target = `${SGTM_URL.replace(/\/$/, "")}${subPath}${incoming.search}`;
    const upstream = await fetch(target, {
      headers: { "User-Agent": request.headers.get("User-Agent") || "" }
    });

    if (upstream.ok) {
      return new Response(upstream.body, {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }
  } catch (e) {
    // Erreur de fetch, on passe au silence
  }

  // SILENCE RADIO : Si le fichier n'existe pas (404), on renvoie un JS vide.
  // Le navigateur reçoit 200 OK, l'adblocker ne voit rien, et l'erreur 404 disparaît.
  return new Response("// Stealth module bypass", {
    status: 200,
    headers: { 
      "Content-Type": "application/javascript; charset=utf-8",
      "X-Stealth-Mode": "active" 
    }
  });
}
