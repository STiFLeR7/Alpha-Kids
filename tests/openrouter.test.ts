import {it,expect,vi,afterEach} from 'vitest';
vi.mock('server-only',()=>({}));
import {generateJson} from '../lib/openrouter';
it('caps stalled provider reading under the stage deadline',async()=>{
 vi.useFakeTimers();
 try{
 vi.stubEnv('OPENROUTER_API_KEY','fiction');
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(new ReadableStream({start(){}}))));
 const pending=generateJson(args,ctx());
 const check=expect(pending).rejects.toMatchObject({reason:'deadline'});
 await vi.advanceTimersByTimeAsync(14000);await check;
 }finally{vi.useRealTimers();}
});
const ctx=()=>({signal:new AbortController().signal,deadlineAt:Date.now()+30000});
const args={system:'policy',input:'fiction',schema:{type:'object'},maxOutputTokens:1024};
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
function response(value:unknown){vi.stubEnv('OPENROUTER_API_KEY','fiction-key');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify(value))));}
it('bounds provider bytes',async()=>{vi.stubEnv('OPENROUTER_API_KEY','fiction');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('x'.repeat(65537))));await expect(generateJson(args,ctx())).rejects.toMatchObject({reason:'invalid_output'});});

for (const [status, headers, reason] of [
  [503, {}, 'provider_failure'],
  [200, {'content-length':'65537'}, 'invalid_output'],
] as const) it(`aborts early provider rejection ${status}`, async () => {
  vi.stubEnv('OPENROUTER_API_KEY', 'fiction');
  const cancel = vi.fn(() => new Promise<void>(() => {}));
  const fetchMock = vi.fn().mockResolvedValue(new Response(new ReadableStream({cancel}), {status, headers}));
  vi.stubGlobal('fetch', fetchMock);
  await expect(generateJson(args, ctx())).rejects.toMatchObject({reason});
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
});

function envelope(message:object={role:'assistant',content:'{"ok":true}'}, choice:object={}) {
 return {object:'chat.completion',model:'particle-ai/particle-1',choices:[{finish_reason:'stop',message,...choice}]};
}
it('extracts content alone and tolerates optional metadata',async()=>{
 response({...envelope({role:'assistant',content:'{"ok":true}',reasoning:'SENTINEL',reasoning_details:[{text:'SENTINEL'}],refusal:null,tool_calls:[]}),usage:{cost:0},provider:'fiction'});
 expect(await generateJson(args,ctx())).toEqual({ok:true});
});
const invalid = [null,[],{}, {object:'chat.completion.chunk',choices:[]},
 {...envelope(),choices:[]},{...envelope(),choices:[{},{}]},
 envelope({}, {finish_reason:'length'}),envelope({}, {finish_reason:'tool_calls'}),
 envelope({role:'user',content:'{}'}),envelope({role:'assistant',content:[]}),
 envelope({role:'assistant',content:' '}),envelope({role:'assistant',content:'not json'}),
 envelope({role:'assistant',content:'{}',refusal:'SENTINEL'}),
 envelope({role:'assistant',content:'{}',tool_calls:[{function:{name:'SENTINEL'}}]}),
 envelope({role:'assistant',content:'{}',tool_calls:{}}),
 envelope({role:'assistant',content:'{}',function_call:{name:'SENTINEL'}}),
 envelope({role:'assistant',reasoning:'{"ok":true}'}),
 {...envelope(),choices:[null]},envelope({}, {error:{message:'SENTINEL'}}),
];
for(const [index,value] of invalid.entries()) it(`rejects invalid envelope ${index} without leaking bodies`,async()=>{
 response(value);
 const result=await generateJson(args,ctx()).catch(error=>error);
 expect(result).toMatchObject({reason:'invalid_output'});
 expect(JSON.stringify(result)).not.toContain('SENTINEL');
});
it('rejects HTTP200 provider errors',async()=>{
 response({...envelope(),error:{message:'SENTINEL'}});
 const result=await generateJson(args,ctx()).catch(error=>error);
 expect(result).toMatchObject({reason:'provider_failure'});
 expect(JSON.stringify(result)).not.toContain('SENTINEL');
});
it('pins the complete zero-price outbound request',async()=>{
 response(envelope());await generateJson(args,ctx());
 expect(fetch).toHaveBeenCalledTimes(1);
 const [url,init]=vi.mocked(fetch).mock.calls[0];
 expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
 expect(init).toMatchObject({method:'POST',redirect:'error',headers:{'content-type':'application/json',Authorization:'Bearer fiction-key'}});
 expect(JSON.parse(init!.body as string)).toEqual({
  model:'particle-ai/particle-1:free',messages:[{role:'system',content:args.system},{role:'user',content:args.input}],
  response_format:{type:'json_schema',json_schema:{name:'parent_coach',strict:true,schema:args.schema}},
  max_tokens:args.maxOutputTokens,stream:false,reasoning:{enabled:false,exclude:true},
  provider:{require_parameters:true,allow_fallbacks:false,max_price:{prompt:0,completion:0,request:0}},
 });
 expect(init!.signal!.aborted).toBe(true);
});
it('fails missing OpenRouter key without fetch or old-key fallback',async()=>{
 vi.stubEnv('OPENROUTER_API_KEY','');vi.stubEnv('GEMINI_API_KEY','fiction');vi.stubGlobal('fetch',vi.fn());
 await expect(generateJson(args,ctx())).rejects.toMatchObject({reason:'provider_failure'});
 expect(fetch).not.toHaveBeenCalled();
});
it('rejects invalid UTF8',async()=>{
 response(envelope());vi.mocked(fetch).mockResolvedValue(new Response(new Uint8Array([0xff])));
 await expect(generateJson(args,ctx())).rejects.toMatchObject({reason:'invalid_output'});
});
it('cancels in-flight fetch and removes the caller listener',async()=>{
 response(envelope());vi.mocked(fetch).mockImplementation(()=>new Promise(()=>{}));
 const controller=new AbortController();const remove=vi.spyOn(controller.signal,'removeEventListener');
 const pending=generateJson(args,{...ctx(),signal:controller.signal});controller.abort();
 await expect(pending).rejects.toMatchObject({reason:'deadline'});
 expect(remove).toHaveBeenCalledWith('abort',expect.any(Function));
 expect(vi.mocked(fetch).mock.calls[0][1]!.signal!.aborted).toBe(true);
});
it('honors the remaining overall budget',async()=>{
 vi.useFakeTimers();
 try {
 response(envelope());vi.mocked(fetch).mockImplementation(()=>new Promise(()=>{}));
 const check=expect(generateJson(args,{...ctx(),deadlineAt:Date.now()+1100})).rejects.toMatchObject({reason:'deadline'});
 await vi.advanceTimersByTimeAsync(100);await check;
 } finally {vi.useRealTimers();}
});
