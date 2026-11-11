/** Isolated office adapter. Not registered with the production server. */
export const REQUEST = Object.freeze({action:'mail.inbox.latest',service_id:'qe-ms365-mcp'});
const LIMIT=65536, TIMEOUT=10000;
export function validate(request) {
  if (!request || Array.isArray(request) || Object.keys(request).sort().join(',')!=='action,service_id' || request.action!==REQUEST.action || request.service_id!==REQUEST.service_id) throw Error('REQUEST_DENIED');
}
export function normalize(value) {
  if (!value || !Array.isArray(value.value) || value.value.length>5) throw Error('INVALID_RESULT');
  const messages=value.value.map(m=>{
    if (!m || typeof m.id!=='string' || typeof m.subject!=='string' || typeof m.receivedDateTime!=='string' || !Number.isFinite(Date.parse(m.receivedDateTime)) || typeof m.isRead!=='boolean' || typeof m.from?.emailAddress?.address!=='string') throw Error('INVALID_RESULT');
    return {id:m.id,from:m.from.emailAddress.address,subject:m.subject,receivedDateTime:m.receivedDateTime,isRead:m.isRead};
  });
  if (messages.some((m,i)=>i && Date.parse(messages[i-1].receivedDateTime)<Date.parse(m.receivedDateTime))) throw Error('INVALID_ORDER');
  const out={status:'ACCEPTED',...REQUEST,messages,count:messages.length};
  if(Buffer.byteLength(JSON.stringify(out))>LIMIT) throw Error('RESULT_TOO_LARGE');
  return out;
}
async function boundedJson(response) {
  if(!response.ok) throw Error(response.status===401||response.status===403?'AUTH_DENIED':'MCP_UNAVAILABLE');
  if(!response.headers.get('content-type')?.includes('application/json')) throw Error('INVALID_RESULT');
  const reader=response.body.getReader(); const chunks=[];let size=0;
  try {for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>LIMIT)throw Error('RESULT_TOO_LARGE');chunks.push(value);}}
  finally {await reader.cancel().catch(()=>{});}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function runOffice(request,{tokenProvider,fetchImpl=fetch}={}) {
  try {
    validate(request);
    if(typeof tokenProvider!=='function') throw Error('AUTH_DENIED');
    const signal=AbortSignal.timeout(TIMEOUT);
    const auth=await tokenProvider(signal);
    if(!auth || auth.account!=='admin@kvantexpert.ru' || auth.clientId!=='657cea31-052c-4e27-b97e-43a146ea72f0' || !auth.scopes?.includes('Mail.Read') || typeof auth.token!=='string' || !auth.token || !(auth.expiresAt>Date.now())) throw Error('AUTH_DENIED');
    async function rpc(id,method,params) {
      const r=await boundedJson(await fetchImpl('http://127.0.0.1:3000/mcp',{method:'POST',headers:{Authorization:'Bearer '+auth.token,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({jsonrpc:'2.0',id,method,params}),signal}));
      if(r.jsonrpc!=='2.0'||r.id!==id||r.error||!r.result)throw Error('INVALID_RESULT');
      return r.result;
    }
    await rpc(1,'initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'qe-supervisor-mail',version:'1'}});
    const r=await rpc(2,'tools/call',{name:'list-mail-folder-messages',arguments:{mailFolderId:'inbox',top:5,orderby:'receivedDateTime desc',select:'id,from,subject,receivedDateTime,isRead'}});
    if(r.isError)throw Error('MCP_UNAVAILABLE');
    const texts=r.content?.filter(x=>x.type==='text');
    if(texts?.length!==1)throw Error('INVALID_RESULT');
    return normalize(JSON.parse(texts[0].text));
  } catch(e) {
    const safe=new Set(['REQUEST_DENIED','AUTH_DENIED','MCP_UNAVAILABLE','INVALID_RESULT','INVALID_ORDER','RESULT_TOO_LARGE']);
    return {status:'BLOCKED',...REQUEST,error:e.name==='TimeoutError'||e.name==='AbortError'?'TIMEOUT':safe.has(e.message)?e.message:'EXECUTION_FAILED'};
  }
}
/** Existing AuthManager owns refresh/persistence; never exports a bearer to Core. */
export function existingAuthProvider(authManager) {
  return async signal=>{
    if(signal.aborted)throw Error('TIMEOUT');
    const a=await authManager.getCurrentAccount();
    if(a?.username?.toLowerCase()!=='admin@kvantexpert.ru' || authManager.config?.auth?.clientId!=='657cea31-052c-4e27-b97e-43a146ea72f0')throw Error('AUTH_DENIED');
    const r=await authManager.msalApp.acquireTokenSilent({account:a,scopes:['Mail.Read','User.Read']});
    if(signal.aborted)throw Error('TIMEOUT');
    return {token:r.accessToken,account:a.username.toLowerCase(),clientId:authManager.config.auth.clientId,scopes:r.scopes,expiresAt:r.expiresOn?.getTime()};
  };
}
