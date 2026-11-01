const DB='pisay-secure-v1';
let key=null,record=null,queue=Promise.resolve(),syncing=false,sequence=0;
let editing=false;
export const setEditing=value=>editing=value;
export let status='Demo · not saved';
export let onStatus=()=>{};
let onRemote=()=>{};
export const setRemoteListener=fn=>onRemote=fn;
export const setStatusListener=fn=>onStatus=fn;
function notify(s){status=s;onStatus(s);}
const b64=bytes=>btoa(Array.from(bytes,c=>String.fromCharCode(c)).join(''));
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function database(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore('vault');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function get(){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('vault');const req=tx.objectStore('vault').get('current');req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();});}
async function put(value){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('vault','readwrite');tx.objectStore('vault').put(value,'current');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);});}
async function derive(pass,salt){const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(salt),iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function encrypt(data,salt){const iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(data)));return {salt,iv:b64(iv),ciphertext:b64(new Uint8Array(ciphertext))};}
async function decrypt(payload,pass){const candidate=await derive(pass,payload.salt);const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(payload.iv)},candidate,bytes(payload.ciphertext));const data=JSON.parse(new TextDecoder().decode(plain));if(data.version!==1||!Array.isArray(data.classes)||!Array.isArray(data.students)||!Array.isArray(data.assignments)||!data.scores)throw Error('Unsupported vault data.');key=candidate;return data;}
export async function inspectVault(){record=await get();sequence=record?.sequence||0;return record;}
export async function unlock(pass){try{const data=await decrypt(record.payload,pass);notify(record.pending?'Saved offline · sync pending':'Encrypted · saved on device');sync();return data;}catch{key=null;throw new Error('The passphrase did not unlock this vault.');}}
async function remote(){const r=await fetch('/api/vault',{cache:'no-store'});if(!r.ok)throw new Error(r.status===401?'Sign in to enable cloud sync.':'Cloud sync is unavailable.');return r.json();}
export async function enable(data,pass){
 if(pass.length<12)throw new Error('Use a passphrase of at least 12 characters.');
 let cloud=null;try{cloud=await remote();}catch{}
 if(cloud?.payload){record={owner:cloud.owner,revision:cloud.revision,payload:cloud.payload,pending:false,sequence:1};const restored=await decrypt(cloud.payload,pass);await put(record);sequence=1;notify('Cloud records restored');return restored;}
 const salt=b64(crypto.getRandomValues(new Uint8Array(16)));key=await derive(pass,salt);
 record={owner:cloud?.owner||null,revision:0,payload:await encrypt(data,salt),pending:true,sequence:1};await put(record);sequence=1;
 await navigator.storage?.persist?.();notify('Encrypted · saved on device');sync();return data;
}
export function isEnabled(){return !!key;}
export function save(data){
 if(!key)return Promise.resolve();const snapshot=structuredClone(data);
 queue=queue.catch(()=>{}).then(async()=>{
  const work=async()=>{const latest=await get();if(latest?.sequence!==sequence)throw new Error('Another tab changed this vault. Reload before editing further.');record={...latest,payload:await encrypt(snapshot,latest.payload.salt),pending:true,sequence:sequence+1};await put(record);sequence=record.sequence;notify(navigator.onLine?'Saved · syncing…':'Saved offline · sync pending');};
  if(navigator.locks)await navigator.locks.request('pisay-vault',work);else await work();
 }).catch(e=>{notify(e.message);throw e;});queue.then(()=>sync(),()=>{});return queue;
}
export async function sync(){
 if(syncing||!record||!navigator.onLine)return;syncing=true;
 try{await queue;const cloud=await remote();if(record.owner&&record.owner!==cloud.owner){notify('Sync paused · different signed-in account');return;}
  if(!record.pending){
   if(cloud.revision>record.revision){
    if(editing){notify('Cloud update waiting · finish editing');return;}
    if(!key||cloud.payload.salt!==record.payload.salt){notify('New cloud version · unlock to restore');return;}
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(cloud.payload.iv)},key,bytes(cloud.payload.ciphertext));const data=JSON.parse(new TextDecoder().decode(plain));
    await queue;const latest=await get();if(latest.pending){notify('Sync conflict · review in Settings');return;}
    record={...latest,payload:cloud.payload,revision:cloud.revision,sequence:latest.sequence+1};await put(record);sequence=record.sequence;onRemote(data);notify('Synced · cloud changes received');
   }else notify('Synced · encrypted');return;
  }
  if(cloud.revision!==record.revision){notify('Sync conflict · review in Settings');return;}
  const sending=record;const res=await fetch('/api/vault',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({owner:cloud.owner,revision:sending.revision,payload:sending.payload})});
  if(res.status===409){notify('Sync conflict · review in Settings');return;}if(!res.ok)throw new Error('Sync unavailable · changes saved offline');const out=await res.json();
  await queue;const update=async()=>{const latest=await get();record={...latest,owner:cloud.owner,revision:out.revision,pending:latest.sequence!==sending.sequence};await put(record);};if(navigator.locks)await navigator.locks.request('pisay-vault',update);else await update();notify(record.pending?'Saved · sync pending':'Synced · encrypted');
 }catch(e){notify(e.message||'Saved offline · sync pending');}finally{syncing=false;}
}
export async function cloudVersion(pass){const cloud=await remote();if(!cloud.payload)throw new Error('No cloud records yet.');if(record.owner&&record.owner!==cloud.owner)throw new Error('This is a different account.');const data=await decrypt(cloud.payload,pass);record={owner:cloud.owner,revision:cloud.revision,payload:cloud.payload,pending:false,sequence:sequence+1};await put(record);sequence=record.sequence;notify('Cloud version restored');return data;}
export async function encryptedBackup(){await queue;return JSON.stringify(await get());}
export async function restoreBackup(text,pass){let backup;try{backup=JSON.parse(text);if(!backup.payload)throw Error();}catch{throw new Error('Invalid vault backup.');}const data=await decrypt(backup.payload,pass);record={...backup,sequence:sequence+1,pending:true};await put(record);sequence=record.sequence;notify('Backup restored · sync pending');return data;}
export async function lock(){await queue;key=null;location.reload();}
addEventListener('online',()=>sync());addEventListener('offline',()=>{if(key)notify('Offline · encrypted local storage');});setInterval(()=>sync(),30000);
