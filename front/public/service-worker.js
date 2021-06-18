self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('v1').then((cache) => {
        return cache.addAll([
          './baku/front/src/',
          './baku/front/public/',
          './baku/back/src/main/',
          './baku/tools/',
          './baku/front/dist/'
        ]);
      })
    );
  });
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});
console.log('salut')

