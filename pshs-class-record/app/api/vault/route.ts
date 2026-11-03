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
export async function PUT(){return json({error:'Offline syncing has been retired. Reload to use the online workspace.'},410);}
