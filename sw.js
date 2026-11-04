// オフライン対応＋自動更新
// ・アプリ本体（ページ）は「ネット優先」：つながれば常に最新版、圏外なら保存済みの版
// ・アイコン等は「保存優先」
const C='westin-v8';
const CORE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
function fromNet(req){return fetch(req,{cache:'no-store'}).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(req,cp));}return res;});}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  const isPage=req.mode==='navigate'||/\/(index\.html)?$/.test(new URL(req.url).pathname);
  if(isPage){
    const net=fromNet(req);
    const timeout=new Promise(r=>setTimeout(r,4000)); // 電波が弱いときは4秒で保存版に切り替え
    e.respondWith(Promise.race([net.catch(()=>null),timeout.then(()=>null)]).then(res=>res||caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('./index.html')).then(r=>r||net)));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>r||fromNet(req)));
});
