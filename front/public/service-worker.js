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
  console.log(tabOfStackPayloads);

  event.respondWith(
  caches.open(CACHE.name+CACHE.version).then(function(cache){

    return cache.match(event.request).then(function(response){
      if (response && (!path.includes("history") || !event.request.referrer.includes("movies/"+projectIdShortened))){
        console.log("La réponse est dans le cache");
        
        if (path.includes("status")){
          projectIdShortened = path.substring(5,41);
          cacheHistoryRequest(tabOfStackPayloads[projectIdShortened]);
        }
        return response;
      } else if (!navigator.onLine){
        // OFFLINE
        if (path === '/api/movie'
        || path === '/api/'+projectId+'/history'
        || path === '/api/'+projectIdShortened+'/history'
        || path === '/api/'+projectId+'/stack'
        || path === '/api/'+projectIdShortened+'/stack'
        || path === '/api/undefined/stack' 
        || path === '/api/'+projectId+'/upload'
        || path === '/api/'+projectIdShortened+'/upload'
        || path === '/api/undefined/stack' 
        || path === '/images/'+projectId+'/thumbnail/'+currentImgName 
        || path === '/images/'+projectId+'/original/'+currentImgName 
        || path === '/images/'+projectId+'/lightweight/'+currentImgName
        || path === '/images/'+projectIdShortened+'/thumbnail/'+currentImgName 
        || path === '/images/'+projectIdShortened+'/original/'+currentImgName 
        || path === '/images/'+projectIdShortened+'/lightweight/'+currentImgName
        || path === '/undefined'){
          
          console.log("create and send adaptated response");
          if (tabOfStackPayloads[projectIdShortened]){
            console.log("On remplit le Tab avec le projectId : "+projectIdShortened+" pour la requête "+event.request.url)
            cacheHistoryRequest(tabOfStackPayloads[projectIdShortened]);
          }
          return createAndSendResponse(event,path);
        } else if(path.includes("stack") &&  event.request.referrer.includes("library")){
            projectIdShortened = path.substring(5,41);
            console.log(projectIdShortened);
            return createAndSendResponse(event,path);
        } else if (path.includes("stack") && event.request.referrer.includes("movie")){
            projectId = path.substring(5,50);
            projectIdShortened = path.substring(5,41);
            console.log(projectId);
            console.log(projectIdShortened);
            return createAndSendResponse(event,path);
        }
      } else {
        // ONLINE
        if (path.includes("stack") && !path.includes("undefined")){
          projectId = path.substring(5,50);
          projectIdShortened = path.substring(5,41);
          console.log(projectId);
          console.log(projectIdShortened);
          fillTabOfStackPayloads(event); 
          console.log(projectId);
        } else if (path.includes("history")){
          projectId = path.substring(5,50);
          projectIdShortened = path.substring(5,41);
          console.log(projectId);
          console.log(tabOfStackPayloads[projectIdShortened] === true);
          if (!tabOfStackPayloads[projectIdShortened]){
            console.log("tab inexistant : initialisation");
            tabOfStackPayloads[projectIdShortened] = [];
          }
          console.log(tabOfStackPayloads);
          cacheHistoryRequest(tabOfStackPayloads[projectIdShortened]);
          cacheStatusResponse();
        } else if(path.includes("upload")){
          createImgFile(event);
        } else if (path.includes("images")){
          cacheImgResponse();
        }
        if (tabOfStackPayloads[projectIdShortened]){
          cacheHistoryRequest(tabOfStackPayloads[projectIdShortened]);
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
      cacheStatusResponse();
      var responseBody = projectIdShortened;
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      console.log(' Responding with a mock response body:', responseBody);
      saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),responseBody);
      return(mockResponse);
      break;

    case "/api/"+projectId+"/history":
    case "/api/"+projectIdShortened+"/history":
      var responseBody = [];
      projectIdShortened = path.substring(5,41);
      console.log(projectIdShortened);
      for (let i =0;i<tabOfStackPayloads[projectIdShortened].length;i++){
        responseBody.push(tabOfStackPayloads[projectIdShortened][i]);
      }
      console.log(tabOfStackPayloads[projectIdShortened]);
      cacheHistoryRequest(responseBody);
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      console.log(' Responding with a mock response body:', responseBody);
      return(mockResponse);
      break;

    case "/api/"+projectId+"/stack":
    case "/api/"+projectIdShortened+"/stack":
      var responseBody = null;
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      console.log(' Responding with a mock response body:', responseBody);
      // On récupère le payload pour le mettre dans un tableau
      
      fillTabOfStackPayloads(event,projectIdShortened);
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
    case "/api/"+projectIdShortened+"/upload":
      var responseBody;
      createImgFile(event);
      responseBody = currentImgName;
      saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),currentImgFile);
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      console.log(' Responding with a mock response body:', responseBody);
      return(mockResponse);
      break;

    case '/images/'+projectId+'/lightweight/'+currentImgName:
    case '/images/'+projectId+'/original/'+currentImgName:
    case '/images/'+projectId+'/thumbnail/'+currentImgName:
      var responseBody = currentImgFile;
      projectId = path.substring(8,53);
      console.log(projectId);
      var responseInit = generateResponseInit();
      var mockResponse = new Response(responseBody, responseInit);
      cacheImgResponse();
      return(mockResponse);
      break;

    case '/images/'+projectIdShortened+'/lightweight/'+currentImgName:
    case '/images/'+projectIdShortened+'/original/'+currentImgName:
    case '/images/'+projectIdShortened+'/thumbnail/'+currentImgName:
      var responseBody = currentImgFile;
      projectIdShortened = path.substring(8,44);
      console.log(projectIdShortened);
      var responseInit = generateResponseInit();
      var mockResponse = new Response(responseBody, responseInit);
      
      cacheImgResponse();
      return(mockResponse);
      break;

    case '/undefined':
      var responseBody = null;
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      console.log(' Responding with a mock response body:', responseBody);
      return(mockResponse);
      break;

    default:
      break;
  }
}

function fillTabOfStackPayloads(event){
  Promise.resolve(event.request.clone().text()).then((payload) => {
    console.log(JSON.stringify(JSON.parse(payload)));
    tabOfStackPayloads[projectIdShortened].push(JSON.parse(payload)[0]);
    if (JSON.parse(payload)[0].action === 1 || JSON.parse(payload)[0].action === 0){
      console.log(tabOfStackPayloads[projectIdShortened]);
      cacheHistoryRequest(tabOfStackPayloads[projectIdShortened]);
    }
    saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),payload);
  })
}

function cacheStatusResponse(){
  const request = new Request('https://localhost/api/'+projectId+'/video/status', {method:'GET'});
  const requestShortened = new Request('https://localhost/api/'+projectIdShortened+'/video/status', {method:'GET'});
  var responseBody = {"status":"NotGenerated","lastModified":0.0};
  var responseInit = generateResponseInit();
  var cacheResponse = new Response(JSON.stringify(responseBody), responseInit);
  var cacheResponseShortened = new Response(JSON.stringify(responseBody), responseInit);
  caches.open(CACHE.name+CACHE.version).then((cache) => {
    cache.put(request,cacheResponse);
    cache.put(requestShortened,cacheResponseShortened);
  })
}

function cacheHistoryRequest(response){
  var reqShortened = new Request('https://localhost/api/'+projectIdShortened+'/history');
  var req = new Request('https://localhost/api/'+projectId+'/history');
  var responseInit = generateResponseInit();
  var cacheResponse = new Response(JSON.stringify(response), responseInit);
  caches.open(CACHE.name+CACHE.version).then((cache) => {
    cache.match(req).then(function(response){
      if (!response){
        cache.put(req,cacheResponse);
      } else {
        cache.delete(req);
        cache.put(req,cacheResponse);
      }
    })
  var cacheResponseShortened = new Response(JSON.stringify(response), responseInit);
    cache.match(reqShortened).then(function(response){
      if (!response){
        cache.put(reqShortened,cacheResponseShortened);
      } else {
        cache.delete(reqShortened);
        cache.put(reqShortened,cacheResponseShortened);
      }
    })
  })
}

function cacheImgResponse(){
  var reqThumb = new Request('https://localhost/images/'+projectId+'/thumbnail/'+currentImgName);
  var reqThumbShortened = new Request('https://localhost/images/'+projectIdShortened+'/thumbnail/'+currentImgName);
  var reqOrig = new Request('https://localhost/images/'+projectId+'/original/'+currentImgName);
  var reqOrigShortened = new Request('https://localhost/images/'+projectIdShortened+'/original/'+currentImgName);
  var reqLight = new Request('https://localhost/images/'+projectId+'/lightweight/'+currentImgName);
  var reqLightShortened = new Request('https://localhost/images/'+projectIdShortened+'/lightweight/'+currentImgName);
  caches.open(CACHE.name+CACHE.version).then((cache) => {
    putInCache(cache,reqThumb);
    putInCache(cache,reqThumbShortened);
    putInCache(cache,reqOrig);
    putInCache(cache,reqOrigShortened);
    putInCache(cache,reqLight);
    putInCache(cache,reqLightShortened);
  }) 
}

function putInCache(cache,req){
  cache.match(req).then(function(response){
    if (!response){
      var cacheResponse = new Response(currentImgFile, generateResponseInit());
      cache.put(req,cacheResponse);
    }
  })
}

function createImgFile(event){
  Promise.resolve(event.request.clone().arrayBuffer()).then((payload) => {
    var binary = '';
    var bytes = new Uint8Array( payload );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
  let indexFile = binary.search("jpeg");
  let currentImgContent = binary.substring(indexFile+8,binary.length-46);
  let currentImgFileData = "data:image/jpeg;base64,"+btoa(currentImgContent);
  let indexName = binary.search("filename");
  currentImgName = binary.substring(indexName+10,indexName+50);
  let currentImgFilePromise = urltoFile(currentImgFileData, '/images/'+projectId+'/lightweight/'+currentImgName);
  Promise.resolve(currentImgFilePromise).then((file)=> {
    currentImgFile = file;
  })
  
});
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
  projectIdShortened = uuidv4();
  tabOfStackPayloads[projectIdShortened] = [];
  console.log(projectId);
  console.log(projectIdShortened);
  console.log(tabOfStackPayloads);
}
