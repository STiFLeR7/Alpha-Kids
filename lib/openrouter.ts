import 'server-only';
import { LIMITS, type CallContext } from './contracts';
import { CoachError } from './errors';

export async function generateJson(args: {system:string;input:string;schema:object;maxOutputTokens:number}, ctx:CallContext):Promise<unknown> {
  const budget = Math.min(LIMITS.stageMs, ctx.deadlineAt-Date.now()-LIMITS.reserveMs);
  if (budget <= 0 || ctx.signal.aborted) throw new CoachError('deadline');
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new CoachError('provider_failure');
  const controller = new AbortController();
  const abort = () => controller.abort();
  ctx.signal.addEventListener('abort', abort, {once:true});
  const timer = setTimeout(abort, budget);
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  try {
    const aborted = new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(new CoachError('deadline')),{once:true}));
    const response = await Promise.race([fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:'POST',redirect:'error',signal:controller.signal,headers:{'content-type':'application/json',Authorization:`Bearer ${key}`},
      body:JSON.stringify({
        model:'particle-ai/particle-1:free',
        messages:[{role:'system',content:args.system},{role:'user',content:args.input}],
        response_format:{type:'json_schema',json_schema:{name:'parent_coach',strict:true,schema:args.schema}},
        max_tokens:args.maxOutputTokens,stream:false,
        reasoning:{enabled:false,exclude:true},
        provider:{require_parameters:true,allow_fallbacks:false,max_price:{prompt:0,completion:0,request:0}},
      })
    }),aborted]);
    if (!response.ok) throw new CoachError('provider_failure');
    if (!response.body || Number(response.headers.get('content-length'))>LIMITS.providerBytes) throw new CoachError('invalid_output');
    reader=response.body.getReader();
    const chunks:Uint8Array[]=[];
    let size=0;
    while(true){
      const chunk=await Promise.race([reader.read(),aborted]);
      if(chunk.done) break;
      size+=chunk.value.byteLength;
      if(size>LIMITS.providerBytes) throw new CoachError('invalid_output');
      chunks.push(chunk.value);
    }
    const bytes=new Uint8Array(size);
    let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    const envelope=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if(!envelope || typeof envelope!=='object' || Array.isArray(envelope)) throw new CoachError('invalid_output');
    if(envelope.error!=null) throw new CoachError('provider_failure');
    if(envelope.object!=='chat.completion' || !Array.isArray(envelope.choices) || envelope.choices.length!==1) throw new CoachError('invalid_output');
    const choice=envelope.choices[0];
    const message=choice?.message;
    if(choice?.finish_reason!=='stop' || choice.error!=null || message?.role!=='assistant' ||
      typeof message.content!=='string' || !message.content.trim() || message.refusal!=null ||
      message.function_call!=null || message.tool_calls!=null && (!Array.isArray(message.tool_calls) || message.tool_calls.length!==0)) throw new CoachError('invalid_output');
    const content=message.content;
    return JSON.parse(content);
  } catch(error) {
    if(controller.signal.aborted) throw new CoachError('deadline');
    if(error instanceof CoachError) throw error;
    throw new CoachError(error instanceof SyntaxError || error instanceof TypeError && reader ? 'invalid_output':'provider_failure');
  } finally {
    controller.abort();
    clearTimeout(timer);
    ctx.signal.removeEventListener('abort',abort);
    if(reader){void reader.cancel().catch(()=>{});reader.releaseLock();}
  }
}
