var CACHE = {
	name: 'Baku-cache',
	version: 'v1'
};

self.addEventListener('install', (event) => {
    event.waitUntil(
      // On precache tous les éléments statiques de notre site
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


self.addEventListener('fetch', async function(event) {
  // On peut checker si les requête sont GET ou POST
    // Si GET : 
    // si on est online : on va les chercher normalement 
    // si on est hors ligne : implémenter une fonction qui va chercher la réponse dans le cache
  if (event.request.method === "GET"){
    event.respondWith(
      // Stratégie "Cache first" : consiste à aller chercher d'abord la réponse de la requête dans le cache
      // Si elle n'est pas dans le cache, on interroge le serveur et on met la réponse dans le cache
        caches.match(event.request).then(function(response) {
          console.log("Requête : "+event.request.url)
          console.log("Réponse : "+response)
            return response || fetch(event.request);
        })
    );
  } else {
    console.log("Dans le POST")
    
    // Si POST :
    // si on est online : pas de soucis 
    // si on est hors ligne : implémenter une fonction qui sauvegarde la requête dans la IndexedDB
        
		if(!navigator.onLine){
      console.log("POST hors ligne")
			var authHeader = event.request.headers.get('Authorization');
			var reqUrl = event.request.url;
      console.log(reqUrl)
			Promise.resolve(event.request.text()).then((payload) => {
				// Fonction qui sauvegarde les requêtes dans l'indexedDB
				saveIntoIndexedDb(reqUrl, authHeader, payload)
			})
		}
  }
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

function saveIntoIndexedDb(url, authHeader, payload) {
	var myRequest = {};
	jsonPayLoad = JSON.parse(payload)
	myRequest.url = url;
	myRequest.authHeader = authHeader;
	myRequest.payload = JSON.stringify(jsonPayLoad);
  console.log("Requête "+myRequest.url+" : "+myRequest.payload)
	var request = indexedDB.open("PostDB");
	request.onsuccess = function (event) {
		var db = event.target.result;
		var tx = db.transaction('postrequest', 'readwrite');
		var store = tx.objectStore('postrequest');
		store.add(myRequest)
	}
}

function checkNetworkState() {
	setInterval(function () {
		if (navigator.onLine) {
		  sendOfflinePostRequestsToServer()
		}
	}, 2000);
}

async function sendOfflinePostRequestsToServer()  {
  var request = indexedDB.open("PostDB");

  
  // Si on est en ligne après un laps de temps hors ligne, on envoie les requêtes en attente au serveur
  request.onsuccess = function(event) {
    // console.log("success" +event.target.result)
    // -- TO DO --
    // Implémenter une fonction qui va chercher les requêtes en attente dans la IndexedDB
    // Et qui les envoie au serveur

  }

  // Si on est en ligne pour la première fois, on initialise la IndexedDB
  request.onupgradeneeded = function(event) {
    console.log("upgraden needed"+event.target.result)
    var db = event.target.result;
    var objectStore = db.createObjectStore("postrequest", { keyPath: 'id', autoIncrement: true });
  }
  
  
}

