import {it,expect,vi,afterEach} from 'vitest';
vi.mock('server-only',()=>({}));
import {generateJson} from '../lib/gemini';
it('rejects multiple candidates and missing text',async()=>{
 for(const envelope of [{candidates:[{},{}]},{candidates:[{finishReason:'STOP',content:{parts:[]}}]}]){
 response(envelope);await expect(generateJson(args,ctx())).rejects.toMatchObject({reason:'invalid_output'});
 }
});
it('caps stalled provider reading under the stage deadline',async()=>{
 vi.useFakeTimers();
 try{
 vi.stubEnv('GEMINI_API_KEY','fiction');
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(new ReadableStream({start(){}}))));
 const pending=generateJson(args,ctx());
 const check=expect(pending).rejects.toMatchObject({reason:'deadline'});
 await vi.advanceTimersByTimeAsync(14000);await check;
 }finally{vi.useRealTimers();}
});
const ctx=()=>({signal:new AbortController().signal,deadlineAt:Date.now()+30000});
const args={system:'policy',input:'fiction',schema:{type:'object'},maxOutputTokens:1024};
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
function response(value:unknown){vi.stubEnv('GEMINI_API_KEY','fiction-key');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify(value))));}
it('extracts only non-thought JSON',async()=>{response({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'private'},{text:'{"ok":true}'}]}}]});expect(await generateJson(args,ctx())).toEqual({ok:true});});
for(const value of [{},{promptFeedback:{blockReason:'SAFETY'}},{candidates:[{finishReason:'MAX_TOKENS'}]},{candidates:[{finishReason:'STOP',content:{parts:[{functionCall:{}}]}}]},{candidates:[{finishReason:'STOP',content:{parts:[{text:'not json'}]}}]}]) it('rejects malformed/blocked provider envelope',async()=>{response(value);await expect(generateJson(args,ctx())).rejects.toMatchObject({reason:'invalid_output'});});
it('bounds provider bytes',async()=>{vi.stubEnv('GEMINI_API_KEY','fiction');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('x'.repeat(65537))));await expect(generateJson(args,ctx())).rejects.toMatchObject({reason:'invalid_output'});});

for (const [status, headers, reason] of [
  [503, {}, 'provider_failure'],
  [200, {'content-length':'65537'}, 'invalid_output'],
] as const) it(`aborts early provider rejection ${status}`, async () => {
  vi.stubEnv('GEMINI_API_KEY', 'fiction');
  const cancel = vi.fn(() => new Promise<void>(() => {}));
  const fetchMock = vi.fn().mockResolvedValue(new Response(new ReadableStream({cancel}), {status, headers}));
  vi.stubGlobal('fetch', fetchMock);
  await expect(generateJson(args, ctx())).rejects.toMatchObject({reason});
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
});

for (const thought of ['true', 1, null]) it(`rejects malformed thought ${thought}`, async () => {
  response({candidates:[{finishReason:'STOP',content:{parts:[{thought,text:'{"wording":"SENTINEL"}'}]}}]});
  const result = await generateJson(args, ctx()).catch(error => error);
  expect(result).toMatchObject({reason:'invalid_output'});
  expect(JSON.stringify(result)).not.toContain('SENTINEL');
});

it('pins the integration model and rejects outbound redirects', async () => {
  response({candidates:[{finishReason:'STOP',content:{parts:[{thought:false,text:'{}'}]}}]});
  await generateJson(args, ctx());
  expect(fetch).toHaveBeenCalledWith(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
    expect.objectContaining({redirect:'error'}),
  );
});
