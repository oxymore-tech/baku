var CACHE = {
	name: 'Baku-cache',
	version: 'v1'
};

var projectId;

self.addEventListener('install', (event) => {
    precacheGetRequest(event);
    // On va checker toutes les 2 secondes si on est hors ligne ou pas
    checkNetworkState();
  });



self.addEventListener('fetch', async function(event) {
  console.log('Handling fetch event for', event.request.url);
  var requestUrl = new URL(event.request.url);
  var path = requestUrl.pathname;

  // Determine whether this is a URL Shortener API request that should be mocked.
  // Matching on just the pathname gives some flexibility in case there are multiple domains that
  // might host the same RESTful API (imagine this being used to mock responses against what might be
  // a test, or QA, or production environment).
  // Also check for the existence of the 'X-Mock-Response' header.
  if (!navigator.onLine) {
    if (path === '/api/movie' || '/api/'+projectId+'/history'){
      console.log("movie ou history");
      createAndSendResponse(event,path);
    }
    // On peut checker si les requête sont GET ou POST
      // Si GET : 
      // si on est online : on va les chercher normalement 
      // si on est hors ligne : implémenter une fonction qui va chercher la réponse dans le cache
    if (event.request.method === "GET"){
      console.log("Requête GET");
      event.respondWith(
        // Stratégie "Cache first" : consiste à aller chercher d'abord la réponse de la requête dans le cache
        // Si elle n'est pas dans le cache, on interroge le serveur et on met la réponse dans le cache
          caches.match(event.request).then(function(response) {
              return response || fetch(event.request)
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

function precacheGetRequest(event) {
  
  event.waitUntil(
    // On precache tous les éléments statiques de notre site
    caches.open(CACHE.name+CACHE.version).then((cache) => {
      return cache.addAll([
        '/',
        '/info',
        '/index.html',
        // '/api/movie',
        '/favicon.png',
        'https://cdn.materialdesignicons.com/2.5.94/fonts/materialdesignicons-webfont.woff2?v=2.5.94',
        '/fonts/baku.9e89ca24.ttf',
        '/fonts/baku.53ae836a.woff',
        '/fonts/baku.d45ef783.eot',
        // '/api/00000000-0000-0000-0000-000000000000/video/status',
        // '/api/00000000-0000-0000-0000-000000000001/video/status',
        // '/api/00000000-0000-0000-0000-000000000002/video/status',
        // '/api/00000000-0000-0000-0000-000000000003/video/status',
        // '/api/00000000-0000-0000-0000-000000000004/video/status',
        // '/api/00000000-0000-0000-0000-000000000005/video/status',
        // '/api/00000000-0000-0000-0000-000000000006/video/status',
        // '/api/00000000-0000-0000-0000-000000000007/video/status',
        '/img/baku_logo_solo.225cb0c9.png ',
        '/img/baku_home_bg.b01000af.png',
        '/img/baku_solo_beta.8e984cff.svg',
        '/img/baku_solo.abec0664.svg',
        '/img/baku-balls-spinner.90935a06.svg',
        '/img/baku-cloud-spinner.5f6d5090.svg',
        '/img/baku.23d9f47f.svg',
        '/img/camera-off-color.bbc514a9.svg',
        '/img/message.f0873c79.png',
        '/img/modify_sound.cae9fb9f.png',
        '/img/play_sound.7d588e44.png',
        '/img/plus.b71e94f4.svg',
        '/img/rotate_phone.f8f9eaa5.gif',
      ]);
    })
  );

}

function saveIntoIndexedDb(url, authHeader, payload) {
  var myRequest = {};
  if (url.includes("upload") || url.includes("movie")){
    jsonPayLoad = payload;
  } else {
    jsonPayLoad = JSON.parse(payload)
  }
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

function createAndSendResponse(event,path){
  switch(path){
    case "/api/movie":
      generateProjectId();
      var responseBody = projectId;

      var responseInit = {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Mock-Response': 'yes'
        }
      };

      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);

      console.log(' Responding with a mock response body:', responseBody);
      event.respondWith(mockResponse);
      //saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),responseBody);
      break;
    case "/api/"+projectId+"/history":
      var responseBody = [];

      var responseInit = {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Mock-Response': 'yes'
        }
      };

      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);

      console.log(' Responding with a mock response body:', responseBody);
      event.respondWith(mockResponse);
      fetch('/movies/'+projectId+'/shots/fedcba');
      //saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),responseBody);
      break;
    default:
      break;
  }
}

function generateProjectId() {
  projectId = "abcdef";
}