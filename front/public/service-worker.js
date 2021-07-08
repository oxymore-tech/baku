import { v4 as uuidv4 } from 'https://jspm.dev/uuid';

var CACHE = {
	name: 'Baku-cache',
	version: 'v1'
};

var projectId;
var projectIdShortened;
var currentImgName;
var currentImgFile;

var tabOfStackPayloads = [];

self.addEventListener('install', (event) => {
  precacheGetRequest(event);
  // On va checker toutes les 2 secondes si on est hors ligne ou pas
  checkNetworkState();
});



self.addEventListener('fetch', async function(event) {
  console.log('Handling fetch event for', event.request.url);
  var requestUrl = new URL(event.request.url);
  var path = requestUrl.pathname;

  event.respondWith(
  caches.open(CACHE.name+CACHE.version).then(function(cache){

    return cache.match(event.request).then(function(response){
      if (response){
        console.log("La réponse est dans le cache");
        return response;
      } else if (!navigator.onLine){
        // Traitement de toutes les requêtes dynamiquement
        if (path === '/api/movie'
        || path === '/api/'+projectId+'/history'
        || path === '/api/'+projectIdShortened+'/history'
        || path === '/api/'+projectId+'/stack'
        || path === '/api/'+projectIdShortened+'/stack'
        || path === '/api/undefined/stack' 
        || path === '/api/'+projectId+'/upload' 
        || path === '/api/'+projectIdShortened+'/video/status' 
        || path === '/api/'+projectIdShortened+'/stack' 
        || path === '/api/undefined/stack' 
        || path === '/api/'+projectId+'/upload' 
        || path === '/images/'+projectId+'/thumbnail/'+currentImgName 
        || path === '/images/'+projectId+'/original/'+currentImgName 
        || path === '/images/'+projectId+'/lightweight/'+currentImgName
        || path === '/images/'+projectIdShortened+'/original/'+currentImgName){
          
          console.log("create and send adaptated response");
          return createAndSendResponse(event,path);
        }     
      } else {
        if(path.includes("stack") && !path.includes("undefined")){
          projectId = path.substring(5,50);
        }
        console.log("No caching response to "+ event.request.url);
        return fetch(event.request);
      }
    })

  })
  )
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
        '/favicon.png',
        '/icon_manifest_192.png',
        '/icon_manifest_512.png',
        // 'https://cdn.materialdesignicons.com/2.5.94/fonts/materialdesignicons-webfont.woff2?v=2.5.94',  BUG sur cette requête -> ???
        '/fonts/baku.9e89ca24.ttf',
        'https://fonts.gstatic.com/s/montserrat/v15/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2',
        '/fonts/baku.53ae836a.woff',
        '/fonts/baku.d45ef783.eot',
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
        '/media/camera_shutter.db38097d.mp3',
        '/js/0.js',
        '/js/app.js',
        '/js/chunk-vendors.js',
        '/manifest.json',
        '/splashscreens/ipad_splash.png',
        '/splashscreens/ipadpro1_splash.png',
        '/splashscreens/ipadpro2_splash.png',
        '/splashscreens/ipadpro3_splash.png',
        '/splashscreens/iphone5_splash.png',
        '/splashscreens/iphone6_splash.png',
        '/splashscreens/iphoneplus_splash.png',
        '/splashscreens/iphonex_splash.png',
        '/splashscreens/iphonexr_splash.png',
        '/splashscreens/iphonexsmax_splash.png'
      ]);
    })
  );

}

function saveIntoIndexedDb(url, authHeader, payload) {
  var myRequest = {};
  var jsonPayLoad;
  if (url.includes("upload") || url.includes("movie")){
    jsonPayLoad = payload;
  } else {
    jsonPayLoad = JSON.parse(payload);
  }
	myRequest.url = url;
	myRequest.authHeader = authHeader;
	myRequest.payload = jsonPayLoad;
  console.log("Requête "+myRequest.url+" : "+myRequest.payload);
	var request = indexedDB.open("PostDB");
	request.onsuccess = function (event) {
		var db = event.target.result;
		var tx = db.transaction('postrequest', 'readwrite');
		var store = tx.objectStore('postrequest');
		store.add(myRequest);
	}
}

function checkNetworkState() {
	setInterval(function () {
		if (navigator.onLine) {
		  sendOfflinePostRequestsToServer();
		}
	}, 2000);
}

async function sendOfflinePostRequestsToServer()  {
  var request = indexedDB.open("PostDB");

  // Si on est en ligne après un laps de temps hors ligne, on envoie les requêtes en attente au serveur
  request.onsuccess = function(event) {
    // console.log("success" +event.target.result)
    // -- TO DO --
    // Implémenter une fonction qui va chercher les requêtes en attente dans la IndexedDB et qui les envoie au serveur
  }
  // Si on est en ligne pour la première fois, on initialise la IndexedDB
  request.onupgradeneeded = function(event) {
    console.log("upgraden needed"+event.target.result);
    var db = event.target.result;
    var objectStore = db.createObjectStore("postrequest", { keyPath: 'id', autoIncrement: true });
  }
}

function createAndSendResponse(event,path){
  switch(path){
    case "/api/movie":
      // Generate a projectId in a UUID format
      generateProjectId();
      var responseBody = projectId;
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      console.log(' Responding with a mock response body:', responseBody);
      saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),projectId);
      return(mockResponse);
      break;

    case "/api/"+projectId+"/history":
      var responseBody = [];
      for (let i =0;i<tabOfStackPayloads[projectId].length;i++){
        responseBody.push(tabOfStackPayloads[projectId][i][0]);
      }
      console.log(tabOfStackPayloads[projectId]);
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      console.log(' Responding with a mock response body:', responseBody);
      return(mockResponse);
      break;

    case "/api/"+projectIdShortened+"/history":
      var responseBody = [];
      for (let i =0;i<tabOfStackPayloads[projectId].length;i++){
        responseBody.push(tabOfStackPayloads[projectId][i][0]);
      }
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      console.log(' Responding with a mock response body:', responseBody);
      return(mockResponse);
      break;

    case "/api/"+projectId+"/stack":
      var responseBody = null;
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      console.log(' Responding with a mock response body:', responseBody);
      // On récupère le payload pour le mettre dans un tableau
      Promise.resolve(event.request.text()).then((payload) => {
        console.log(JSON.stringify(JSON.parse(payload)));
        tabOfStackPayloads[projectId].push(JSON.parse(payload));
        saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),payload);
      })
      return(mockResponse);
      break;

    case "/api/"+projectIdShortened+"/stack":
      var responseBody = null;
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      console.log(' Responding with a mock response body:', responseBody);
      
      // On récupère le payload pour le mettre dans un tableau
      Promise.resolve(event.request.text()).then((payload) => {
        console.log(JSON.stringify(JSON.parse(payload)));
        tabOfStackPayloads[projectId].push(JSON.parse(payload));
        saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),payload);
      })
      return(mockResponse);
      break;

    case "/api/undefined/stack":
      var responseBody = null;
      var responseInit = generateResponseInit();
      Promise.resolve(event.request.text()).then((payload) => {
        saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),payload);
      })
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      console.log(' Responding with a mock response body:', responseBody);
      return(mockResponse);
      break;

    case "/api/"+projectId+"/upload":
      var responseBody;
      Promise.resolve(event.request.clone().arrayBuffer()).then((payload) => {
        console.log(payload);
          var binary = '';
          var bytes = new Uint8Array( payload );
          var len = bytes.byteLength;
          for (var i = 0; i < len; i++) {
              binary += String.fromCharCode( bytes[ i ] );
          }
          console.log(binary);
        let indexFile = binary.search("jpeg");
        let currentImgContent = binary.substring(indexFile+8,binary.length-46);
        console.log(currentImgContent);
        // Base64
        let currentImgFileData = "data:image/jpeg;base64,"+btoa(currentImgContent);
        let indexName = binary.search("filename");
        currentImgName = binary.substring(indexName+10,indexName+50);
        responseBody = currentImgName;

        let currentImgFilePromise = urltoFile(currentImgFileData, '/images/'+projectId+'/lightweight/'+currentImgName);
        
        Promise.resolve(currentImgFilePromise).then((file)=> {
          currentImgFile = file;
        })
        saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),binary);
      });
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      console.log(' Responding with a mock response body:', responseBody);
      return(mockResponse);
      break;

    case '/images/'+projectId+'/lightweight/'+currentImgName:
    case '/images/'+projectId+'/original/'+currentImgName:
    case '/images/'+projectId+'/thumbnail/'+currentImgName:
      var responseBody = currentImgFile;
      var responseInit = generateResponseInit();
      var mockResponse = new Response(responseBody, responseInit);
      // Promise.resolve(event.request.text()).then((payload) => {
      //   saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),payload);
      // })
      // console.log(' Responding with a mock response body:', responseBody);
      caches.open(CACHE.name+CACHE.version).then((cache) => {
        cache.match(event.request).then(function(response){
          if (!response){
            var cacheResponse = new Response(responseBody, responseInit);
            cache.put(event.request.clone(),cacheResponse);
          }
        })
      })
      return(mockResponse);
      break;

    case "/api/"+projectIdShortened+"/video/status":
      var responseBody = {"status":"NotGenerated","lastModified":0.0};
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      // Utile ou pas ?
      // Promise.resolve(event.request.text()).then((payload) => {
      //   saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),payload);
      // })
      console.log(' Responding with a mock response body:', responseBody);
      return(mockResponse);
      break;

    case "/images/"+projectIdShortened+"/original/"+currentImgName:
      var responseBody = currentImgFile;
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      // Utile ou pas ?
      // Promise.resolve(event.request.text()).then((payload) => {
      //   saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),payload);
      // })
      console.log(' Responding with a mock response body:', responseBody);
      return(mockResponse);
      break;

    default:
      break;
  }
}

function urltoFile(url, filename, mimeType){
  mimeType = mimeType || (url.match(/^data:([^;]+);/)||'')[1];
  return (fetch(url)
      .then(function(res){return res.arrayBuffer();})
      .then(function(buf){return new File([buf], filename, {type:mimeType});})
  );
}


function generateResponseInit() {
  return({
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'application/json',
      'X-Mock-Response': 'yes'
    }
  });
}

function generateProjectId() {
  projectId = uuidv4();
  // projectId = random_hexa(8).concat("-").concat(random_hexa(4)).concat("-").concat(random_hexa(4)).concat("-").concat(random_hexa(4)).concat("-").concat(random_hexa(8)).concat("-").concat(random(13));
  projectIdShortened = projectId.substring(0,36);
  tabOfStackPayloads[projectId] = [];
  console.log(projectId);
  console.log(projectIdShortened);
  console.log(tabOfStackPayloads);
}
  
const random_hexa = (length = 8) => {
  return Math.random().toString(16).substr(2, length); //créé une chaine de caractère en hexadécimal de longueur length
};

const random = (length = 8) => {
  return Math.random().toString(36).substr(2, length); //créé une chaine de caractère alphanumérique
};