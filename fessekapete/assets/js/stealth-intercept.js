/**
 * sw-stealth.js - Service Worker de Camouflage
 * Gère l'interception et le bypass des flux de tracking
 */

self.addEventListener('install', (event) => {
  // Force l'activation immédiate du Service Worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Prend le contrôle des pages immédiatement
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // --- 1. EXCEPTION DE DEBUG (BYPASS) ---
  // Si l'URL contient "DUMMY" ou "tagassist", on ignore la requête.
  // Cela évite les erreurs CORS et les rejets 400 sur sGTM.
  if (url.searchParams.has('id') && url.searchParams.get('id') === 'DUMMY' || url.href.includes('tagassist')) {
    return; // Le navigateur gère la requête nativement via le réseau standard
  }

  // --- 2. LOGIQUE D'INTERCEPTION ---
  // On n'intercepte que ce qui est lié à Google ou à notre chemin de camouflage
  const isGoogle = url.hostname.includes('google') || url.hostname.includes('doubleclick');
  const isProxy = url.pathname.includes('/assets/lib/web-vitals');

  if (isGoogle || isProxy) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Si la réponse est OK (200-299), on la renvoie telle quelle
          if (response.ok || response.status === 0) {
            return response;
          }
          
          // Si c'est une erreur 404/400 sur un script, on renvoie un script vide (Camouflage)
          if (url.pathname.endsWith('.js') || url.href.includes('gtag/js') || url.href.includes('gtm.js')) {
            return new Response('/* Stealth bypass - Resource active */', {
              status: 200,
              headers: { 'Content-Type': 'application/javascript' }
            });
          }
          
          return response;
        })
        .catch((err) => {
          // Sécurité anti-crash : si le fetch échoue (Adblocker ou réseau), on simule une réussite
          console.warn('Stealth SW interception bypass applied:', url.href);
          return new Response('/* Stealth bypass - Network offline */', {
            status: 200,
            headers: { 'Content-Type': 'application/javascript' }
          });
        })
    );
  }
});
