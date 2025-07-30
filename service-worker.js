const CACHE = 'floaty-cloud-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];
self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS))
  );
});
self.addEventListener('fetch', e=>{
  e.respondWith(
    caches.match(e.request).then(resp=> resp || fetch(e.request))
  );
});
