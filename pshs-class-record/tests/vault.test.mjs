import test from 'node:test';
import assert from 'node:assert/strict';
// In-memory IndexedDB adapter; crypto uses Node's real Web Crypto implementation.
let local=null,cloud=null,revision=0,online=false;
globalThis.addEventListener=()=>{};
Object.defineProperty(globalThis,'navigator',{value:{get onLine(){return online;},storage:{persist:async()=>true},locks:{request:async(_name,fn)=>fn()}},configurable:true});
globalThis.indexedDB={open(){const req={};queueMicrotask(()=>{req.result={createObjectStore(){},close(){},transaction(){const tx={objectStore(){return {get(){const r={};queueMicrotask(()=>{r.result=structuredClone(local);r.onsuccess?.();tx.oncomplete?.();});return r;},put(value){local=structuredClone(value);queueMicrotask(()=>tx.oncomplete?.());}};}};return tx;}};req.onsuccess?.();});return req;}};
const realSetInterval=globalThis.setInterval;globalThis.setInterval=(...args)=>{const id=realSetInterval(...args);id.unref();return id;};
globalThis.fetch=async(_url,opts={})=>{if(!online)throw Error('Offline');if(!opts.method)return Response.json({owner:'test-owner',email:'test@example.com',revision,payload:cloud});const body=JSON.parse(opts.body);if(body.revision!==revision)return Response.json({}, {status:409});cloud=body.payload;return Response.json({owner:'test-owner',revision:++revision});};
const vault=await import('../public/store.js');
const data={version:1,classes:[],students:[{id:'s',name:'Confidential test name'}],assignments:[],scores:{}};
const wait=async(fn)=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw Error('Timed out');};
test('encrypted offline save, wrong-passphrase rejection, automatic upload and conflict preservation',async()=>{
 assert.equal(await vault.inspectVault(),null);
 await vault.enable(data,'a-test-passphrase-only');
 assert.ok(local.payload.ciphertext);assert.ok(!JSON.stringify(local).includes('Confidential test name'));assert.equal(local.pending,true);
 const firstIv=local.payload.iv;
 await vault.save({...data,year:'2026–2027'});assert.notEqual(local.payload.iv,firstIv);
 await assert.rejects(vault.unlock('incorrect-passphrase'));
 const restored=await vault.unlock('a-test-passphrase-only');assert.equal(restored.students[0].name,'Confidential test name');assert.equal(restored.year,'2026–2027');
 online=true;await vault.sync();await wait(()=>local.revision===1);assert.equal(local.pending,false);assert.equal(cloud.ciphertext,local.payload.ciphertext);
 online=false;await vault.save({...data,year:'offline-edit'});const pending=local.payload.ciphertext;
 revision=2;online=true;await vault.sync();assert.match(vault.status,/conflict/i);assert.equal(local.payload.ciphertext,pending);assert.equal(local.pending,true);
 const backup=JSON.parse(await vault.encryptedBackup());assert.equal(backup.payload.ciphertext,pending);
 // Wrong cloud passphrase must not poison the existing local encryption key.
 await assert.rejects(vault.cloudVersion('incorrect-passphrase'));online=false;
 await vault.save({...data,year:'still-local'});const final=await vault.unlock('a-test-passphrase-only');assert.equal(final.year,'still-local');
});
