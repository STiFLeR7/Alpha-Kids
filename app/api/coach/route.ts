import { z } from 'zod';
import { CoachRequestSchema, PublicResponseSchema, LIMITS, type Language, type UnavailableReason } from '../../../lib/contracts';
import { errorCopy } from '../../../lib/copy';
import { resolveLanguage } from '../../../lib/locale';
import { CoachError } from '../../../lib/errors';
import { coach } from '../../../lib/coach';
export const runtime='nodejs';
let active=0;
const statuses:Record<UnavailableReason,number>={invalid_request:400,too_large:413,limit_reached:422,forbidden_origin:403,busy:429,provider_failure:503,deadline:504,invalid_output:503,review_rejected:200};
function localOrigin(request:Request):boolean{
  try{
    const url=new URL(request.url);
    const origin=new URL(request.headers.get('origin')??'');
    const loopback=['localhost','127.0.0.1','[::1]'];
    // Next normalizes loopback URL hostnames; compare the actual Host against Origin.
    return loopback.includes(url.hostname) && loopback.includes(origin.hostname) && ['http:','https:'].includes(url.protocol) && origin.protocol===url.protocol && origin.port===url.port && request.headers.get('origin')===origin.origin && request.headers.get('host')===origin.host;
  }catch{return false;}
}
export async function POST(request:Request):Promise<Response>{
  const deadlineAt=Date.now()+LIMITS.deadlineMs;
  const controller=new AbortController();
  const abort=()=>controller.abort();
  request.signal.addEventListener('abort',abort,{once:true});
  if(request.signal.aborted) abort();
  const timer=setTimeout(abort,LIMITS.deadlineMs);
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  let slot=false;
  let requestId:string|null=null;
  let language:Language='en';
  const respond=(data:unknown,status:number)=>Response.json(PublicResponseSchema.parse(data),{status,headers:{'cache-control':'no-store'}});
  try{
    if(!localOrigin(request)) throw new CoachError('forbidden_origin');
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??'')) throw new CoachError('invalid_request');
    if(Number(request.headers.get('content-length'))>LIMITS.requestBytes) throw new CoachError('too_large');
    if(active>=LIMITS.inFlight) throw new CoachError('busy');
    active++;slot=true;
    if(controller.signal.aborted) throw new CoachError('deadline');
    const aborted=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(new CoachError('deadline')),{once:true}));
    if(!request.body) throw new CoachError('invalid_request');
    reader=request.body.getReader();
    const chunks:Uint8Array[]=[];
    let size=0;
    while(true){
      const chunk=await Promise.race([reader.read(),aborted]);
      if(chunk.done) break;
      size+=chunk.value.length;
      if(size>LIMITS.requestBytes) throw new CoachError('too_large');
      chunks.push(chunk.value);
    }
    const bytes=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    let raw;
    try{raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new CoachError('invalid_request');}
    if(z.uuid().safeParse(raw?.requestId).success) requestId=raw.requestId;
    if(Array.isArray(raw?.transcript) && (raw.transcript.length>15 || raw.transcript.filter((t:unknown)=>typeof t==='object' && t!==null && 'role' in t && t.role==='user').length>LIMITS.userTurns)) throw new CoachError('limit_reached');
    const parsed=CoachRequestSchema.safeParse(raw);
    if(!parsed.success) throw new CoachError('invalid_request');
    const input=parsed.data;
    let previous:Language='en';
    for(const turn of input.transcript) if(turn.role==='assistant') previous=turn.reply.language;
    const last=input.transcript.at(-1)!;
    language=resolveLanguage(input.replyLanguage,last.role==='user'?last.text:'',previous);
    const reply=await Promise.race([coach(input,{signal:controller.signal,deadlineAt}),aborted]);
    return respond({requestId:input.requestId,ok:true,reply},200);
  }catch(error){
    const reason=controller.signal.aborted?'deadline':error instanceof CoachError?error.reason:'provider_failure';
    return respond({requestId,ok:false,error:errorCopy(reason,language)},statuses[reason]);
  }finally{
    clearTimeout(timer);request.signal.removeEventListener('abort',abort);
    if(reader){void reader.cancel().catch(()=>{});reader.releaseLock();}
    if(slot) active--;
  }
}

