import {afterEach, expect, it, vi} from 'vitest';
vi.mock('server-only', () => ({}));
import {POST} from '../app/api/coach/route';
import {PublicResponseSchema} from '../lib/contracts';

const draft = {
 route:{kind:'coach',reason:'everyday_parenting'},language:'en',
 candidate:{kind:'coach',reason:'everyday_parenting',language:'en',acknowledgment:'SENTINEL',steps:['Pause.','Listen.'],checkIn:'How did it go?'},
};
const review = {assessment:draft.route,decision:'accept',checks:{prohibitedAdvice:false,inventedFacts:false,languageMismatch:false,missingCheckIn:false,harmfulParenting:false}};
function envelope(value:unknown, thought?:unknown) {
 return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(value),...(thought===undefined?{}:{thought})}]}}]}));
}
function request() {
 return new Request('http://127.0.0.1:3000/api/coach',{
  method:'POST',headers:{host:'127.0.0.1:3000',origin:'http://127.0.0.1:3000','content-type':'application/json'},
  body:JSON.stringify({requestId:'123e4567-e89b-42d3-a456-426614174000',replyLanguage:'en',transcript:[{role:'user',text:'Bedtime is difficult.'}]}),
 });
}
afterEach(() => {vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('keeps the actual A sentinel out of the public response when B fails', async () => {
 vi.stubEnv('GEMINI_API_KEY','fiction');
 const fetchMock=vi.fn().mockResolvedValueOnce(envelope(draft)).mockResolvedValueOnce(new Response('SENTINEL provider detail',{status:503}));
 vi.stubGlobal('fetch',fetchMock);
 const response=await POST(request());
 const payload=await response.json();
 expect(response.status).toBe(503);
 expect(PublicResponseSchema.safeParse(payload).success).toBe(true);
 expect(payload).toMatchObject({ok:false,error:{reason:'provider_failure'}});
 expect(JSON.stringify(payload)).not.toContain('SENTINEL');
 expect(fetchMock).toHaveBeenCalledTimes(2);
});
for (const thought of ['true',1,null]) it(`blocks malformed thought ${thought} before public release`, async () => {
 vi.stubEnv('GEMINI_API_KEY','fiction');
 const fetchMock=vi.fn().mockResolvedValueOnce(envelope(draft,thought)).mockResolvedValueOnce(envelope(review));
 vi.stubGlobal('fetch',fetchMock);
 const response=await POST(request());
 const payload=await response.json();
 expect(response.status).toBe(503);
 expect(PublicResponseSchema.safeParse(payload).success).toBe(true);
 expect(payload).toMatchObject({ok:false,error:{reason:'invalid_output'}});
 expect(JSON.stringify(payload)).not.toContain('SENTINEL');
 expect(fetchMock).toHaveBeenCalledTimes(1);
});
