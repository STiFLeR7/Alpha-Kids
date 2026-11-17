import {it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('../lib/coach',()=>({coach:vi.fn()}));
import {POST} from '../app/api/coach/route';
import {coach} from '../lib/coach';
import {NextRequest} from 'next/server';
it('accepts Next-normalized loopback URLs only when actual Host and Origin match',async()=>{
 vi.mocked(coach).mockReset().mockResolvedValue({kind:'clarify',reason:'missing_context',language:'en',question:'How old is your child?'});
 const normalized=new NextRequest(req());
 expect(new URL(normalized.url).hostname).toBe('localhost');
 expect((await POST(normalized)).status).toBe(200);
 const mismatched=new NextRequest(req('http://localhost:3000'));
 expect((await POST(mismatched)).status).toBe(403);
});
it('rejects malformed public output and never exposes its wording',async()=>{
 vi.mocked(coach).mockResolvedValueOnce({kind:'coach',acknowledgment:'SENTINEL'} as never);
 const response=await POST(req());
 expect(response.status).toBe(503);
 expect(await response.text()).not.toContain('SENTINEL');
});
it('releases slots after aborted work and rejects excess concurrency',async()=>{
 vi.mocked(coach).mockReset().mockImplementation(()=>new Promise(()=>{}));
 const controllers=[new AbortController(),new AbortController()];
 const pending=controllers.map(c=>POST(new Request(req(),{signal:c.signal})));
 await vi.waitFor(()=>expect(coach).toHaveBeenCalledTimes(2));
 expect((await POST(req())).status).toBe(429);
 controllers.forEach(c=>c.abort());
 expect((await Promise.all(pending)).map(r=>r.status)).toEqual([504,504]);
 vi.mocked(coach).mockRejectedValueOnce(new Error('private'));
 expect((await POST(req())).status).toBe(503);
});
it('caps stalled request reading under the overall deadline',async()=>{
 vi.useFakeTimers();
 try{
 const request=new Request('http://127.0.0.1:3000/api/coach',{method:'POST',headers:{host:'127.0.0.1:3000',origin:'http://127.0.0.1:3000','content-type':'application/json'},body:new ReadableStream({start(){}}),duplex:'half'} as RequestInit);
 const pending=POST(request);
 await vi.advanceTimersByTimeAsync(30000);
 expect((await pending).status).toBe(504);
 vi.mocked(coach).mockRejectedValueOnce(new Error('private'));
 expect((await POST(req())).status).toBe(503);
 }finally{vi.useRealTimers();}
});
const body={requestId:'123e4567-e89b-42d3-a456-426614174000',replyLanguage:'en',transcript:[{role:'user',text:'Bedtime.'}]};
function req(origin:string|null='http://127.0.0.1:3000',payload:unknown=body){return new Request('http://127.0.0.1:3000/api/coach',{method:'POST',headers:{'content-type':'application/json',host:'127.0.0.1:3000',...(origin?{origin}:{})},body:JSON.stringify(payload)});}
it('rejects missing and attacker origins',async()=>{for(const origin of [null,'http://attacker.test','http://localhost:4000'])expect((await POST(req(origin))).status).toBe(403);});
it('rejects arbitrary matching host',async()=>{expect((await POST(new Request('http://attacker.test/api/coach',{method:'POST',headers:{origin:'http://attacker.test',host:'attacker.test','content-type':'application/json'},body:JSON.stringify(body)}))).status).toBe(403);});
it('enforces byte and turn caps',async()=>{expect((await POST(req(undefined,{...body,padding:'x'.repeat(65536)}))).status).toBe(413);expect((await POST(req(undefined,{...body,transcript:Array.from({length:17},()=>body.transcript[0])}))).status).toBe(422);});
it('sanitizes exceptions and marks no-store',async()=>{vi.mocked(coach).mockRejectedValueOnce(new Error('PRIVATE'));const result=await POST(req());expect(result.status).toBe(503);expect(result.headers.get('cache-control')).toBe('no-store');expect(await result.text()).not.toContain('PRIVATE');});

