import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in to sync.'},401);
 if(!env.DB)return json({error:'Sync database unavailable.'},503);
 const row=await env.DB.prepare('SELECT payload, revision FROM vaults WHERE user_id = ?').bind(user.userId).first<{payload:string;revision:number}>();
 return json({owner:user.userId,email:user.email,revision:row?.revision||0,payload:row?JSON.parse(row.payload):null});
}
export async function PUT(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in to sync.'},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Invalid origin.'},403);
 if(!env.DB)return json({error:'Sync database unavailable.'},503);
 const raw=await request.text();if(raw.length>4_000_000)return json({error:'Record exceeds 4 MB sync limit.'},413);
 let body;try{body=JSON.parse(raw);}catch{return json({error:'Invalid JSON.'},400);}
 const {owner,revision,payload}=body;
 if(owner!==user.userId)return json({error:'This offline vault belongs to another account.'},403);
 if(!Number.isInteger(revision)||revision<0||!payload||typeof payload.ciphertext!=='string'||typeof payload.iv!=='string'||typeof payload.salt!=='string'||payload.iv.length!==16||payload.salt.length!==24||!/^[A-Za-z0-9+/=]+$/.test(payload.ciphertext))return json({error:'Invalid encrypted record.'},400);
 const now=new Date().toISOString();let result;
 if(revision===0){result=await env.DB.prepare('INSERT INTO vaults (user_id,payload,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(user_id) DO NOTHING').bind(user.userId,JSON.stringify(payload),now).run();}
 else{result=await env.DB.prepare('UPDATE vaults SET payload = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ?').bind(JSON.stringify(payload),now,user.userId,revision).run();}
 if(!result.meta.changes)return json({error:'Another device has newer changes. Resolve the conflict before syncing.'},409);
 return json({revision:revision+1,owner:user.userId});
}
