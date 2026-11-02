const CACHE='pisay-shell-v8';
const FILES=['/index.html','/style.css','/app.js','/grade.js','/student-profile.js','/school-demo.js','/store.js','/xlsx.full.min.js','/manifest.webmanifest','/icon.svg','/grading-sheet.js','/vendor/pdf-lib.min.js','/vendor/exceljs.min.js','/branding/pshs.jpg','/branding/dost.jpg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pisay-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.origin!==location.origin||event.request.method!=='GET'||url.pathname.startsWith('/api/')||url.pathname.includes('chatgpt'))return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/index.html')));return;}
 if(FILES.includes(url.pathname))event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
