import test from 'node:test';
import assert from 'node:assert/strict';
const events={};globalThis.addEventListener=(name,fn)=>events[name]=fn;
let revision=0,cloud=null,fail=false,conflict=false,writes=0;
globalThis.fetch=async(_url,options={})=>{
 if(fail)throw Error('Connection lost');
 if(!options.method)return Response.json({revision,data:cloud});
 writes++;const body=JSON.parse(options.body);
 if(conflict||body.revision!==revision)return Response.json({error:'Changed in another tab'},{status:409});
 cloud=body.data;return Response.json({revision:++revision});
};
const store=await import('../public/store.js');
test('online saves serialize revisions, report failures, and never retry or persist offline',async()=>{
 const data={version:1,students:[],classes:[],assignments:[],scores:{}};
 assert.equal(await store.load(),null);
 await Promise.all([store.save({...data,teacher:'First'}),store.save({...data,teacher:'Second'})]);
 assert.equal(revision,2);assert.equal(cloud.teacher,'Second');assert.equal(store.status,'Saved online');assert.equal(store.hasUnsavedChanges(),false);
 fail=true;await assert.rejects(store.save(data),/Connection lost/);assert.equal(store.hasUnsavedChanges(),true);assert.match(store.status,/NOT SAVED/);
 let prevented=false;events.beforeunload({preventDefault(){prevented=true;}});assert.equal(prevented,true);
 fail=false;const before=writes;events.online();assert.equal(writes,before);await assert.rejects(store.save(data),/not saved/);assert.equal(writes,before);
 await store.load();conflict=true;await assert.rejects(store.save(data),/Changed in another tab/);assert.equal(store.hasUnsavedChanges(),true);
});
