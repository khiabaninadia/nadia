// network-first + bypass HTTP cache: always fresh when online, works offline from cache
const C='nadia-v2';
const ASSETS=['./','index.html','manifest.webmanifest','apple-touch-icon.png','icon-192.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>Promise.all(ASSETS.map(a=>fetch(a,{cache:'reload'}).then(r=>r.ok&&c.put(a,r)).catch(()=>{})))));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.hostname==='api.github.com')return;
  const same=u.origin===location.origin;
  // same-origin files skip the browser's HTTP cache (GitHub Pages caches ~10 min)
  const net=same?fetch(e.request.url,{cache:'no-store',credentials:'same-origin'}):fetch(e.request);
  e.respondWith(
    net.then(r=>{
      if(r.ok&&(same||u.hostname.includes('fonts.g'))){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}
      return r;
    }).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(m=>m||caches.match('index.html')))
  );
});
