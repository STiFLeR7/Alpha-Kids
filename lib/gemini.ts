import 'server-only';
import { LIMITS, type CallContext } from './contracts';
import { CoachError } from './errors';

export async function generateJson(args: {system:string;input:string;schema:object;maxOutputTokens:number}, ctx:CallContext):Promise<unknown> {
  const budget = Math.min(LIMITS.stageMs, ctx.deadlineAt-Date.now()-LIMITS.reserveMs);
  if (budget <= 0 || ctx.signal.aborted) throw new CoachError('deadline');
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new CoachError('provider_failure');
  const controller = new AbortController();
  const abort = () => controller.abort();
  ctx.signal.addEventListener('abort', abort, {once:true});
  const timer = setTimeout(abort, budget);
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  try {
    const aborted = new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(new CoachError('deadline')),{once:true}));
    const response = await Promise.race([fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
      method:'POST',signal:controller.signal,headers:{'content-type':'application/json','x-goog-api-key':key},
      body:JSON.stringify({systemInstruction:{parts:[{text:args.system}]},contents:[{role:'user',parts:[{text:args.input}]}],generationConfig:{responseMimeType:'application/json',responseJsonSchema:args.schema,maxOutputTokens:args.maxOutputTokens,thinkingConfig:{thinkingLevel:'LOW'}}})
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
    if(envelope.promptFeedback?.blockReason || !Array.isArray(envelope.candidates) || envelope.candidates.length!==1) throw new CoachError('invalid_output');
    const candidate=envelope.candidates[0];
    if(candidate.finishReason!=='STOP' || !Array.isArray(candidate.content?.parts)) throw new CoachError('invalid_output');
    let content='';
    for(const part of candidate.content.parts){
      if(typeof part.text!=='string' || Object.keys(part).some(k=>!['text','thought','thoughtSignature'].includes(k))) throw new CoachError('invalid_output');
      if(part.thought!==true) content+=part.text;
    }
    return JSON.parse(content);
  } catch(error) {
    if(controller.signal.aborted) throw new CoachError('deadline');
    if(error instanceof CoachError) throw error;
    throw new CoachError(error instanceof SyntaxError || error instanceof TypeError && reader ? 'invalid_output':'provider_failure');
  } finally {
    clearTimeout(timer);
    ctx.signal.removeEventListener('abort',abort);
    if(reader){void reader.cancel().catch(()=>{});reader.releaseLock();}
  }
}
