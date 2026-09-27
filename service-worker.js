const CACHE='heavenly-manna-v9-contextual-references-2026-09-27';
const ASSETS=[
 './','./index.html','./MANNA.css','./MANNA.js','./MANNA-DATA.js','./VOW-DATA.js',
 './MANNA-logo.svg','./HEAVENLY-MANNA.pdf','./MORNING-VOW.pdf',
 './FAVICON.svg','./FAVICON-16.png','./FAVICON-32.png','./FAVICON-192.png','./FAVICON-512.png','./APPLE-TOUCH-ICON.png',
 './FONT-INTER-REGULAR.otf','./FONT-INTER-MEDIUM.otf','./FONT-INTER-SEMIBOLD.otf','./FONT-INTER-BOLD.otf',
 './FONT-NOTO-SANS-MALAYALAM-REGULAR.ttf','./FONT-NOTO-SANS-MALAYALAM-SEMIBOLD.ttf','./FONT-NOTO-SERIF-MALAYALAM-REGULAR.ttf','./FONT-NOTO-SERIF-MALAYALAM-SEMIBOLD.ttf',
 './manifest.webmanifest'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET') return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
  const url=new URL(event.request.url);const cacheableExternal=/^(query|api)\.getbible\.net$/.test(url.hostname);if((response.ok||response.type==='opaque')&&(url.origin===location.origin||cacheableExternal)){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
  return response;
 }).catch(()=>caches.match('./index.html'))));
});
