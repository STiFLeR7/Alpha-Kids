import { describe, it, expect, vi } from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('../lib/gemini',()=>({generateJson:vi.fn()}));
import { generateJson } from '../lib/gemini';
import { arbitrate, coach } from '../lib/coach';
import type { DraftResult, ReviewResult, CoachRequest } from '../lib/contracts';
const flags={prohibitedAdvice:false,inventedFacts:false,languageMismatch:false,missingCheckIn:false,harmfulParenting:false};
const plan={kind:'coach',reason:'everyday_parenting',language:'en',acknowledgment:'SENTINEL',steps:['Pause.','Listen.'],checkIn:'How did it go?'} as const;
const a:DraftResult={route:{kind:'coach',reason:'everyday_parenting'},language:'en',candidate:{...plan,steps:[...plan.steps]}};
const b:ReviewResult={assessment:a.route,decision:'accept',checks:flags};
const request:CoachRequest={requestId:'123e4567-e89b-42d3-a456-426614174000',replyLanguage:'en',transcript:[{role:'user',text:'Bedtime is difficult.'}]};
const ctx=()=>({signal:new AbortController().signal,deadlineAt:Date.now()+30000});
for(const bad of [{},{...a,language:'xx'},{...a,candidate:{...a.candidate,language:'ur'}},{route:{kind:'urgent',reason:'medical'},language:'en',candidate:null}]) it('rejects invalid A before review',async()=>{
 vi.mocked(generateJson).mockReset().mockResolvedValueOnce(bad);
 await expect(coach(request,ctx())).rejects.toMatchObject({reason:'invalid_output'});
 expect(generateJson).toHaveBeenCalledTimes(1);
});
it('does not release sentinel wording after rejected or failed B',async()=>{
 for(const result of [{...b,decision:'reject'},{...b,assessment:{kind:'clarify',reason:'missing_context'}}]){
 vi.mocked(generateJson).mockReset().mockResolvedValueOnce(a).mockResolvedValueOnce(result);
 await expect(coach(request,ctx())).rejects.toMatchObject({reason:'review_rejected'});
 }
});
for(const bad of [{},{...b,decision:'maybe'},{...b,checks:{...flags,harmfulParenting:'false'}}]) it('rejects malformed B without releasing wording',async()=>{
 vi.mocked(generateJson).mockReset().mockResolvedValueOnce(a).mockResolvedValueOnce(bad);
 await expect(coach(request,ctx())).rejects.toMatchObject({reason:'invalid_output'});
 expect(generateJson).toHaveBeenCalledTimes(2);
});
describe('arbitration',()=>{
 it('releases only accepted matching wording',()=>{expect(arbitrate(a,b)).toEqual(a.candidate);expect(arbitrate(a,{...b,decision:'reject'})).toBeNull();expect(arbitrate(a,{...b,assessment:{kind:'clarify',reason:'missing_context'}})).toBeNull();});
 for(const flag of Object.keys(flags)) it(`rejects ${flag}`,()=>expect(arbitrate(a,{...b,checks:{...flags,[flag]:true}})).toBeNull());
 const routes=[{kind:'urgent',reason:'immediate_emergency'},{kind:'urgent',reason:'imminent_self_harm'},{kind:'urgent',reason:'imminent_harm_to_others'},{kind:'urgent',reason:'uncertain_current_danger'},{kind:'urgent',reason:'self_harm_distress'},{kind:'safeguarding',reason:'child_abuse'},{kind:'safeguarding',reason:'domestic_abuse'},{kind:'safeguarding',reason:'suspected_abuse'},{kind:'boundary',reason:'medical'},{kind:'boundary',reason:'legal'},{kind:'boundary',reason:'harmful_request'},{kind:'boundary',reason:'off_topic'}] as const;
 for(const [i,left] of routes.entries()) for(const [j,right] of routes.entries()) it(`precedence ${left.reason}/${right.reason}`,()=>{
 const result=arbitrate({route:left,language:'en',candidate:null},{...b,assessment:right,decision:'reject'});expect(result?.reason).toBe(routes[Math.min(i,j)].reason);expect(JSON.stringify(result)).not.toContain('SENTINEL');
 });
 it('strips actual candidate labels before review',async()=>{vi.mocked(generateJson).mockResolvedValueOnce(a).mockResolvedValueOnce(b);await coach(request,ctx());const input=JSON.parse(vi.mocked(generateJson).mock.calls.at(-1)![0].input);expect(input.candidate.kind).toBeUndefined();expect(input.candidate.reason).toBeUndefined();});
 it('skips review for escalation',async()=>{vi.mocked(generateJson).mockClear().mockResolvedValueOnce({route:routes[0],language:'en',candidate:null});expect((await coach(request,ctx())).kind).toBe('urgent');expect(generateJson).toHaveBeenCalledTimes(1);});
 it('rejects explicit language mismatch even for escalation',async()=>{vi.mocked(generateJson).mockResolvedValueOnce({route:routes[0],language:'ur',candidate:null});await expect(coach(request,ctx())).rejects.toMatchObject({reason:'invalid_output'});});
 it('reviews boundary with null and fails closed if B fails',async()=>{vi.mocked(generateJson).mockResolvedValueOnce({route:routes[8],language:'en',candidate:null}).mockRejectedValueOnce(new Error('private'));await expect(coach(request,ctx())).rejects.toThrow();expect(JSON.parse(vi.mocked(generateJson).mock.calls.at(-1)![0].input).candidate).toBeNull();});
});

const clarification:DraftResult={route:{kind:'clarify',reason:'missing_context'},language:'en',candidate:{kind:'clarify',reason:'missing_context',language:'en',question:'SENTINEL question?'}};
const fixedRoutes=[
 {kind:'urgent',reason:'immediate_emergency'},
 {kind:'urgent',reason:'imminent_self_harm'},
 {kind:'urgent',reason:'imminent_harm_to_others'},
 {kind:'urgent',reason:'uncertain_current_danger'},
 {kind:'urgent',reason:'self_harm_distress'},
 {kind:'safeguarding',reason:'child_abuse'},
 {kind:'safeguarding',reason:'domestic_abuse'},
 {kind:'safeguarding',reason:'suspected_abuse'},
 {kind:'boundary',reason:'medical'},
 {kind:'boundary',reason:'legal'},
 {kind:'boundary',reason:'harmful_request'},
 {kind:'boundary',reason:'off_topic'},
] as const;
for (const source of [a, clarification]) {
 for (const route of fixedRoutes) it(`discards ${source.route.kind} sentinel for B ${route.reason}`, () => {
  const result=arbitrate(source,{...b,assessment:route,decision:'reject',checks:{...flags,harmfulParenting:true}});
  expect(result?.reason).toBe(route.reason);
  expect(JSON.stringify(result)).not.toContain('SENTINEL');
 });
}
for (const route of fixedRoutes) it(`uses A ${route.reason} with the required call count`, async () => {
 const fixed:DraftResult={route,language:'en',candidate:null};
 vi.mocked(generateJson).mockReset().mockResolvedValueOnce(fixed);
 if (route.kind==='boundary') vi.mocked(generateJson).mockResolvedValueOnce(b);
 const result=await coach(request,ctx());
 expect(result.reason).toBe(route.reason);
 expect(generateJson).toHaveBeenCalledTimes(route.kind==='boundary'?2:1);
 expect(JSON.stringify(result)).not.toContain('SENTINEL');
});
for (const assessment of [a.route,clarification.route]) it(`retains A boundary against B ${assessment.kind}`, () => {
 const result=arbitrate({route:{kind:'boundary',reason:'medical'},language:'en',candidate:null},{...b,assessment});
 expect(result?.reason).toBe('medical');
});
it('accepts clarification and rejects the reverse clarify/coach mismatch', async () => {
 vi.mocked(generateJson).mockReset().mockResolvedValueOnce(clarification).mockResolvedValueOnce({...b,assessment:clarification.route});
 expect(await coach(request,ctx())).toEqual(clarification.candidate);
 expect(generateJson).toHaveBeenCalledTimes(2);
 vi.mocked(generateJson).mockReset().mockResolvedValueOnce(clarification).mockResolvedValueOnce(b);
 await expect(coach(request,ctx())).rejects.toMatchObject({reason:'review_rejected'});
 expect(generateJson).toHaveBeenCalledTimes(2);
});
