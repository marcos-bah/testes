'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "manifest.json": "2c716d5dca6b12f50173a696ae67b306",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"version.json": "c8728b3fab7a158a6da5838e3a82f213",
"splash/style.css": "3310f8170d554be3ace57bc266ea7b5c",
"splash/img/light-3x.png": "b8edcadac630ccf40fa9689b49b225e1",
"splash/img/light-2x.png": "2ec33c8de5a4b4dc8eca84e0086c22ee",
"splash/img/dark-2x.png": "2ec33c8de5a4b4dc8eca84e0086c22ee",
"splash/img/light-1x.png": "3f190200da92d6b00d35c8c61f98be90",
"splash/img/dark-3x.png": "b8edcadac630ccf40fa9689b49b225e1",
"splash/img/dark-1x.png": "3f190200da92d6b00d35c8c61f98be90",
"1favicon.png": "5dcef449791fa27946b3d35ad8803796",
"index.html": "d3f3fb55c3ec86ad65eb3ca2e1e6a3ff",
"/": "d3f3fb55c3ec86ad65eb3ca2e1e6a3ff",
"assets/NOTICES": "0ac300fef806555fe2399c738879525a",
"assets/fonts/MaterialIcons-Regular.otf": "4e6447691c9509f7acdbf8a931a85ca1",
"assets/FontManifest.json": "e2f11d8c680c40a5bab037c4c88bbc67",
"assets/AssetManifest.json": "95ace0cb27661c2d1eb47220dd5b0793",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"assets/assets/icons/predio.png": "b65361d3098aae3e6f3a515ccd4e732f",
"assets/assets/fonts/Manrope-Bold.ttf": "656753569aef606dd528cc6bdf672cdc",
"assets/assets/fonts/Manrope-ExtraBold.ttf": "47e356f61dca7aa2dfba5593e000c4f1",
"assets/assets/fonts/Manrope-Medium.ttf": "6196e0dab83345b15290ee22620358c1",
"assets/assets/fonts/Manrope-SemiBold.ttf": "255d425d09667bc095e79a8bd8081aba",
"assets/assets/fonts/Manrope-Light.ttf": "55aaaa1366df7c6544c2204b032a6e31",
"assets/assets/fonts/Manrope-Regular.ttf": "0b726174d2b7e161b9e5e8125bf7751a",
"assets/assets/fonts/Manrope-ExtraLight.ttf": "a4b068ee8a8bdb4d976648992bb1db90",
"assets/assets/images/dac-bg.jpg": "5ca8d02650c0f904fbb4d6eedcb92d04",
"assets/assets/images/DAC.jpeg": "c808f75d92f5066a077f5fe72acbfea6",
"assets/assets/images/dac-d.png": "ca8f0978b826977237d7790fab6e0c58",
"favicon.png": "ca8f0978b826977237d7790fab6e0c58",
"main.dart.js": "11bf42134cf9ffa2856570d6087b42b3"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
