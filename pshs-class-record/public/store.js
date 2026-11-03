// Online-only persistence. No local database, encryption key, or background sync.
let endpoint='/api/workspace';
let revision=0,enabled=false,pending=0,failed=false,queue=Promise.resolve(),listener=()=>{};
export let status='Demo · not saved';
const notify=s=>{status=s;listener(s);};
export const setStatusListener=fn=>listener=fn;
export const isEnabled=()=>enabled;
export const hasUnsavedChanges=()=>pending>0||failed;
export async function load(simulation=false){
 endpoint=simulation?'/api/workspace?demo=school':'/api/workspace';
 const r=await fetch(endpoint,{cache:'no-store'});if(!r.ok)throw Error(r.status===401?'Sign in to open your workspace.':'Cannot open workspace. Check your connection and retry.');
 const body=await r.json();revision=body.revision;enabled=true;failed=false;notify('Saved online');return body.data;
}
export function save(data){
 if(!enabled)return Promise.resolve();const snapshot=JSON.stringify(data);pending++;notify('Saving online…');
 const operation=queue.then(async()=>{
  if(failed)throw Error('Changes are not saved. Reload the online workspace before continuing.');
  try{
   const r=await fetch(endpoint,{method:'PUT',headers:{'Content-Type':'application/json'},body:`{"revision":${revision},"data":${snapshot}}`});
   const body=await r.json();if(!r.ok)throw Error(body.error||'Unable to save online.');revision=body.revision;
  }catch(e){failed=true;throw Error(e.message||'Connection lost. Changes are not saved.');}
 }).finally(()=>{pending--;notify(failed?'NOT SAVED · reload required':pending?'Saving online…':'Saved online');});
 queue=operation.catch(()=>{});return operation;
}
addEventListener('beforeunload',e=>{if(hasUnsavedChanges()){e.preventDefault();e.returnValue='';}});
addEventListener('offline',()=>{if(enabled)notify('Offline · editing unavailable');});
addEventListener('online',()=>{if(enabled)notify(failed?'NOT SAVED · reload required':pending?'Saving online…':'Connected · online workspace');});
