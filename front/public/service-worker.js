import { v4 as uuidv4 } from 'https://jspm.dev/uuid';

var CACHE = {
	name: 'Baku-cache',
	version: 'v1'
};

// projectId : projet créé online
var projectId;
//projectIdShortened : projet créé offline
var projectIdShortened;
var currentImgName;
var currentSoundName;
var currentSoundFile;
var currentImgFile;
var currentSoundContent2;

// Tableau récapitulatif des stacks de chaque projet (utile pour les requêtes history)
var tabOfStackPayloads = [];

// Installation du service worker
self.addEventListener('install', (event) => {
  precacheGetRequest(event);
  checkNetworkState();
});


// Interception de toutes les requêtes pour les traiter dynamiquement en offline
self.addEventListener('fetch', async function(event) {
  // On récupère l'url de la requête à traiter
  var requestUrl = new URL(event.request.url);

  // On récupère le chemin (après https://localhost)
  var path = requestUrl.pathname;

  event.respondWith(
  caches.open(CACHE.name+CACHE.version).then(function(cache){

    return cache.match(event.request).then(function(response){
      
      if (!navigator.onLine){
        // OFFLINE
        // Si la réponse est déjà dans le cache et qu'on est en dehors du cas "Requête history depuis un projet créé hors ligne", on renvoie cette réponse
        if (response && (!path.includes("history") || !event.request.referrer.includes("movies/"+projectIdShortened))){
          
          if (path.includes("status")){
            projectIdShortened = path.substring(5,41);
            cacheHistoryRequest(tabOfStackPayloads[projectIdShortened]);
          }
          return response;
        } else if (path === '/api/movie'
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
        || path === "/api/"+projectIdShortened+"/uploadSound"
        || path === '/api/'+projectId+'/uploadSound'
        || path === '/undefined'){
          
          // Si le projet est intialisé, on met la requête history en cache
          if (tabOfStackPayloads[projectIdShortened]){
            cacheHistoryRequest(tabOfStackPayloads[projectIdShortened]);
          }
          return createAndSendResponse(event,path);
          // Si on est dans le cas "Requête stack depuis la bibliothèque", on met à jour le projectIdShortened
        } else if(path.includes("stack") &&  event.request.referrer.includes("library")){
            projectIdShortened = path.substring(5,41);
            return createAndSendResponse(event,path);
          // Si on est dans le cas "Requête stack depuis le projet", on met à jour le projectId et le projectIdShortened
        } else if (path.includes("stack") && event.request.referrer.includes("movie")){
            projectId = path.substring(5,50);
            projectIdShortened = path.substring(5,41);
          return createAndSendResponse(event,path);
        }else if(path.includes("sounds") && event.request.referrer.includes("audio")){
           var currentSoundName2 =  path.substring(path.search("/sounds/")+8);
           console.log("we are here" );
           console.log(currentSoundName2+" currentsoundName ");
           return asyncCallerFunction(currentSoundName2) ;
        }
      } else {
        // ONLINE
        // Si on est dans le cas "Requête stack sans undefined", on met à jour le projectId et le projectIdShortened et on remplit le tableau
        if (path.includes("stack") && !path.includes("undefined")){
          projectId = path.substring(5,50);
          projectIdShortened = path.substring(5,41);
          fillTabOfStackPayloads(event); 
          // Si c'est une requête history, on met à jour les projectId
        } else if (path.includes("history")){
          projectId = path.substring(5,50);
          projectIdShortened = path.substring(5,41);
          if (!tabOfStackPayloads[projectIdShortened]){
            console.log("tab inexistant : initialisation");
            tabOfStackPayloads[projectIdShortened] = [];
          }
          cacheHistoryRequest(tabOfStackPayloads[projectIdShortened]);
          cacheStatusResponse();
        } else if(path.includes("upload")){
          createImgFile(event);
        } else if (path.includes("images")){
          cacheImgResponse();
          if (response){
            return response;
          }
        }
        if (tabOfStackPayloads[projectIdShortened]){
          cacheHistoryRequest(tabOfStackPayloads[projectIdShortened]);
        }
        return fetch(event.request);
      }
    })

  })
  )
});

// Activation : Mise à jour du cache
self.addEventListener('activate', (event) => {
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

 async function asyncCallerFunction(currentSoundName2){
  console.log(" got here ");
  await promiseFunction(currentSoundName2);
  console.log(currentSoundContent2);
  return new Response(currentSoundContent2,generateResponseInit());

}
function promiseFunction(currentSoundName2){
  return new Promise((resolve,reject)=>{
    const request = indexedDB.open("PostDB");  
    request.onsuccess =  function(event){
    var db = event.target.result;
    var tx = db.transaction('postrequest', 'readwrite');
    var store = tx.objectStore('postrequest');
    var allRecords = store.getAll();
      allRecords.onsuccess = function() {
      var records = allRecords.result;
      //var currentSoundName2 = path.substring(path.search("/sounds/")+8); 
      for (var i = 0; i < records.length; i++){
        //console.log(records[i].payload.name+" avec le payload");
        if(records[i].payload.name == currentSoundName2){
          currentSoundContent2 = records[i].payload.data;
          console.log(currentSoundContent2);
          resolve();
        }
      }
    }
  }
    });
}
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

// On sauvegarde toutes les requêtes post dans la IndexedDB de notre navigateur
function saveIntoIndexedDb(url, authHeader, payload) {
  var myRequest = {};
  var jsonPayLoad;
  if (url.includes("upload")){
    myRequest.payload = payload;
  } else {
    jsonPayLoad = JSON.parse(payload);
    myRequest.payload = JSON.stringify(jsonPayLoad);
  }
	myRequest.url = url;
	myRequest.authHeader = authHeader;
	var request = indexedDB.open("PostDB");
	request.onsuccess = function (event) {
		var db = event.target.result;
		var tx = db.transaction('postrequest', 'readwrite');
		var store = tx.objectStore('postrequest');
		store.add(myRequest);
	}
}

// On vérifie toutes les 1/2 secondes si on est online ou offline
function checkNetworkState() {
	setInterval(function () {
		if (navigator.onLine) {
		  sendOfflinePostRequestsToServer();
		}
	}, 500);
}

async function sendOfflinePostRequestsToServer()  {
  var request = indexedDB.open("PostDB");

  // Si on est en ligne après un laps de temps hors ligne, on envoie les requêtes en attente au serveur
  request.onsuccess = function(event) {
    //console.log("success" +event.target.result)
    var db = event.target.result;
		var tx = db.transaction('postrequest', 'readwrite');
		var store = tx.objectStore('postrequest');
		var allRecords = store.getAll();
		allRecords.onsuccess = function () {

			if (allRecords.result && allRecords.result.length > 0) {
        

				var records = allRecords.result
        //console.log(records)
				for (var i = 0; i < records.length; i++){
          // Traitement de la requête stack
          if (records[i].url.includes("stack")){
            fetch(records[i].url, {
              method: "POST",
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': records[i].authHeader
              },
              body: records[i].payload
            })
            // Traitement de la requête upload
          } else if (records[i].url.includes("upload") && !records[i].url.includes("uploadSound") ){
            var formData = new FormData();
            var blob = imagetoblob(records[i].payload.data)
            formData.set("file",blob,records[i].payload.name);
            for (var [key, value] of formData.entries()) { 
              console.log(key, value);
            }
            console.log(records[i].payload);
            fetch(records[i].url, {
              method: "POST",
              body: formData
            })
            var req = new Request(records[i].payload.data);
            fetch(req);
          }else if (records[i].url.includes("uploadSound")){
            var formData = new FormData();
            var blob = records[i].payload.data;
            formData.set("file",blob,records[i].payload.name);
            fetch(records[i].url, {
              method: "POST",
              body: formData
            })
            var req = new Request(records[i].payload.data);
            fetch(req);
          }
					store.delete(allRecords.result[i].id)
        }
			}
		};
  }
  // Si on est en ligne pour la première fois, on initialise la IndexedDB
  request.onupgradeneeded = function(event) {
    console.log("upgraden needed"+event.target.result);
    var db = event.target.result;
    var objectStore = db.createObjectStore("postrequest", { keyPath: 'id', autoIncrement: true });
  }
}

function imagetoblob(base64String){
    // Split the base64 string in data and contentType
    const block = base64String.split(';');
    // Get the content type of the image
    const contentType = block[0].split(':')[1]; // In this case "image/gif"
    // get the real base64 content of the file
    const realData = block[1].split(',')[1]; // In this case "R0lGODlhPQBEAPeoAJosM...."

    // Convert it to a blob to upload
    return b64toBlob(realData, contentType);
  }

function b64toBlob(b64Data,contentType = '',sliceSize = 512){
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
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
      return(mockResponse);
      break;
      
    case "/api/"+projectId+"/history":
    case "/api/"+projectIdShortened+"/history":
      var responseBody = [];
      projectIdShortened = path.substring(5,41);
      //console.log(projectIdShortened);
      for (let i =0;i<tabOfStackPayloads[projectIdShortened].length;i++){
        responseBody.push(tabOfStackPayloads[projectIdShortened][i]);
      }
      //console.log(tabOfStackPayloads[projectIdShortened]);
      cacheHistoryRequest(responseBody);
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
      return(mockResponse);
      break;

    case "/api/"+projectId+"/stack":
    case "/api/"+projectIdShortened+"/stack":
      var responseInit = generateResponseInit();
      var mockResponse = new Response('null', responseInit);
      // On récupère le payload pour le mettre dans un tableau
      
      fillTabOfStackPayloads(event,projectIdShortened);
      return(mockResponse);
      break;

    case "/api/undefined/stack":
      var responseInit = generateResponseInit();
      Promise.resolve(event.request.text()).then((payload) => {
        saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),payload);
      })
      var mockResponse = new Response('null', responseInit);
      return(mockResponse);
      break;

    case "/api/"+projectId+"/upload":
    case "/api/"+projectIdShortened+"/upload":
      var responseBody;
      createImgFile(event);
      responseBody = currentImgName;
      var responseInit = generateResponseInit();
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
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
      return(mockResponse);
      break;

    case "/api/"+projectId+"/uploadSound":  
    case "/api/"+projectIdShortened+"/uploadSound":
      var responseBody;
      createSoundFile(event);
      responseBody = projectIdShortened;
      var responseInit = generateResponseInit();         
      //saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),currentSoundFile);
      var mockResponse = new Response(JSON.stringify(responseBody), responseInit);  
      return(mockResponse);

     case "/api/"+projectIdShortened+"/sounds/"+currentSoundName:
        
      var responseInit = generateResponseInit();       
      var mockResponse = new Response(responseBodySound, responseInit);  
      return (mockResponse); 
      
    case "/api/"+projectId+"/sounds/"+currentSoundName:        
        var responseBody = currentSoundFile;      
        var responseInit = generateResponseInit();
        var mockResponse = new Response(responseBody, responseInit);     
       
        return (mockResponse);

    default:
      break;
  }
}

// Remplissage du tableau de stacks
function fillTabOfStackPayloads(event){
  Promise.resolve(event.request.clone().text()).then((payload) => {
    tabOfStackPayloads[projectIdShortened].push(JSON.parse(payload)[0]);
    if (JSON.parse(payload)[0].action === 1 || JSON.parse(payload)[0].action === 0){
      cacheHistoryRequest(tabOfStackPayloads[projectIdShortened]);
    }
    if (!navigator.onLine){
      saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),payload);
    }
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
    let imgPayload = {
      data : currentImgFileData,
      name : currentImgName
    }
    if (!navigator.onLine){
      saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),imgPayload);
    } 
  });
  Promise.resolve(event.request.clone().formData()).then((formData) => {
    currentImgFile = formData.get("file");
  })
}

function createSoundFile(event){
  Promise.resolve(event.request.clone().arrayBuffer()).then((payload) => {
    var binary = '';
    var bytes = new Uint8Array( payload );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }    
  let indexFile = binary.search("wav");  
  let currentSoundContent = binary.substring(indexFile+7,binary.length);
  //let currentSoundFileData = currentSoundContent;
  let indexName = binary.search("filename");
  currentSoundName = binary.substring(indexName+10,indexName+46);  
  
  Promise.resolve(event.request.clone().formData()).then((formData)=> {
    currentSoundFile = formData.get("file");
    
    let soundFileCache ={
      data : currentSoundFile,
      name : currentSoundName
    };

    if(!navigator.onLine){
      saveIntoIndexedDb(event.request.url,event.request.headers.get('Authorization'),soundFileCache);
     /* caches.open(CACHE.name+CACHE.version).then((cache) => {
        cache.add(currentSoundFile);*/
      };
  
    })  
    //soundpayloads[soundpayloads.length] = soundFileCache;
    //console.log(soundpayloads);
  })

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
}
