// Retire prior offline caches without touching old student databases.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('pisay-shell-'))await caches.delete(key);
 await self.registration.unregister();
})()));
