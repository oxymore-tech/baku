var CACHE = {
	name: 'Baku-cache',
	version: 'v1'
};

self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE.name+CACHE.version).then((cache) => {
        return cache.addAll([
          './baku/front/src/',
          './baku/front/public/',
          './baku/back/src/main/',
          './baku/tools/',
          './baku/front/dist/'
        ]);
      })
    );
    // On va checker toutes les 2 secondes si on est hors ligne ou pas
    checkNetworkState();
  });


self.addEventListener('fetch', function(event) {
    event.respondWith(
      // Stratégie "Cache first" : consiste à aller chercher d'abord la réponse de la requête dans le cache
      // Si elle n'est pas dans le cache, on interroge le serveur et on met la réponse dans le cache
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});


self.addEventListener('activate', (event) => {
	console.info('Event: Activate');
	event.waitUntil(
		self.clients.claim(),
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cache) => {
					if (cache !== CACHE.name + CACHE.version) {
						// On supprime les anciennes données dans le cache pour éviter qu'il ne grossisse indéfiniement
						return caches.delete(cache);
					}
				})
			);
		})
	);
})

function checkNetworkState() {
	setInterval(function () {
		if (navigator.onLine) {
			sendOfflinePostRequestsToServer()
		}
	}, 2000);
}

async function sendOfflinePostRequestsToServer()  {
  var request = indexedDB.open("TrayTrackingPostDB");

  
  // Si on est en ligne après un laps de temps hors ligne, on envoie les requêtes en attente au serveur
  request.onsuccess = function(event) {
    console.log("success" +event.target.result)
    // -- TO DO --
    // Implémenter une fonction qui va chercher les requêtes en attente dans la IndexedDB
    // Et qui les envoie au serveur

  }

  // Si on est en ligne pour la première fois, on initialise la IndexedDB
  request.onupgradeneeded = function(event) {
    console.log("upgraden needed"+event.target.result)
    var objectStore;
    objectStore = db.createObjectStore("postrequest", { keyPath: 'id', autoIncrement: true });
  }
  
  
}

