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
