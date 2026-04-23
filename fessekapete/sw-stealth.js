/*! sw-stealth.js — intercepte toute requête réseau */
const FIRST_PARTY_PROXY = '/assets/lib/web-vitals';
const BLOCKED_RE = /^https?:\/\/(www\.|region1\.|ssl\.|stats\.)?(google-?(tag)?manager|google-analytics|doubleclick)\.(com|net)/i;

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (!BLOCKED_RE.test(url)) return;
  const rewritten = url.replace(BLOCKED_RE, self.location.origin + FIRST_PARTY_PROXY);
  event.respondWith(
    fetch(new Request(rewritten, {
      method: event.request.method,
      headers: event.request.headers,
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow'
    }))
  );
});
