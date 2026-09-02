'use strict';

const CACHE = 'flashcards-v48';
const FLAG_CODES = (
  'af al dz ad ao ag ar am au at az bs bh bd bb by be bz bj bt bo ba bw br bn bg bf bi ' +
  'cv kh cm ca cf td cl cn co km cg cd cr ci hr cu cy cz dk dj dm do ec eg sv gq er ee sz ' +
  'et fj fi fr ga gm ge de gh gr gd gt gn gw gy ht hn hu is in id ir iq ie il it jm jp jo ' +
  'kz ke ki kw kg la lv lb ls lr ly li lt lu mg mw my mv ml mt mh mr mu mx fm md mc mn me ' +
  'ma mz mm na nr np nl nz ni ne ng kp mk no om pk pw ps pa pg py pe ph pl pt qa ro ru rw ' +
  'kn lc vc ws sm st sa sn rs sc sl sg sk si sb so za kr ss es lk sd sr se ch sy tj tz th ' +
  'tl tg to tt tn tr tm tv ug ua ae gb us uy uz vu va ve vn ye zm zw'
).split(' ');
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './generators.js',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './flags/LICENSE.flag-icons.txt',
  ...FLAG_CODES.map(code => `./flags/${code}.svg`)
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => {
        // First install can activate immediately. Updates wait for the user.
        if (!self.registration.active) return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Allow the page to trigger immediate activation of a waiting worker.
self.addEventListener('message', event => {
  if (event.data === 'activate-v47' || event.data === 'activate-v48') self.skipWaiting();
});

function isAppCode(url) {
  // App shell / code should prefer the network so updates land quickly.
  return url.pathname.endsWith('/') ||
         url.pathname.endsWith('.html') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.webmanifest');
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Network-first for navigations and app code: fresh when online, cache offline.
  if (sameOrigin && (req.mode === 'navigate' || isAppCode(url))) {
    event.respondWith(
      fetch(req)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for everything else (icons, images): fast + offline.
  event.respondWith(
    caches.match(req).then(cached =>
      cached ||
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => cached)
    )
  );
});
