import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in to open your workspace.'},401);
 if(!env.DB)return json({error:'Database unavailable.'},503);
 const rows=await env.DB.prepare('SELECT w.revision, c.slot, c.payload FROM online_workspaces w LEFT JOIN online_workspace_chunks c ON c.user_id=w.user_id WHERE w.user_id=? ORDER BY c.slot').bind(user.userId+(new URL(request.url).searchParams.get('demo')==='school'?':school-simulation':'')).all<{revision:number;slot:number|null;payload:string|null}>();
 const data=rows.results;return json({revision:data[0]?.revision||0,data:data.length&&data[0].payload!==null?JSON.parse(data.map(r=>r.payload).join('')):null});
}
export async function PUT(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in again before saving.'},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Invalid origin.'},403);
 if(!env.DB)return json({error:'Database unavailable.'},503);
 const raw=await request.text();if(new TextEncoder().encode(raw).length>40_000_000)return json({error:'Workspace exceeds the 40 MB request limit.'},413);
 let body;try{body=JSON.parse(raw);}catch{return json({error:'Invalid JSON.'},400);}
 if(!body||typeof body!=='object')return json({error:'Invalid workspace.'},400);
 const {revision,data}=body;
 if(!Number.isSafeInteger(revision)||revision<0||data?.version!==1||!Array.isArray(data.students)||!Array.isArray(data.classes)||!Array.isArray(data.assignments)||!data.scores||typeof data.scores!=='object'||Array.isArray(data.scores))return json({error:'Invalid workspace.'},400);
 const payload=JSON.stringify(data),chunks=[];for(let i=0;i<payload.length;){let end=Math.min(i+128000,payload.length);const last=payload.charCodeAt(end-1);if(end<payload.length&&last>=0xD800&&last<=0xDBFF)end--;chunks.push(payload.slice(i,end));i=end;}
 const db=env.DB,uid=user.userId+(new URL(request.url).searchParams.get('demo')==='school'?':school-simulation':'');
 // D1 batch is transactional. Revision guards protect every mutation, including chunks.
 const statements=[db.prepare('INSERT INTO online_workspaces(user_id,revision) VALUES(?,0) ON CONFLICT(user_id) DO NOTHING').bind(uid),db.prepare('DELETE FROM online_workspace_chunks WHERE user_id=? AND EXISTS(SELECT 1 FROM online_workspaces WHERE user_id=? AND revision=?)').bind(uid,uid,revision),...chunks.map((chunk,slot)=>db.prepare('INSERT INTO online_workspace_chunks(user_id,slot,payload) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM online_workspaces WHERE user_id=? AND revision=?)').bind(uid,slot,chunk,uid,revision)),db.prepare('UPDATE online_workspaces SET revision=revision+1 WHERE user_id=? AND revision=?').bind(uid,revision)];
 const result=await db.batch(statements);if(!result[result.length-1].meta.changes)return json({error:'This workspace changed in another tab. Reload before editing.'},409);
 return json({revision:revision+1});
}
