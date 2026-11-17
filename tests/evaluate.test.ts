import { test, expect } from 'vitest';
import { createServer } from 'node:http';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

test('runner chains public replies, stops failures, and preserves separately identified artifacts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'alpha-eval-stub-'));
  const received: any[] = [];
  const reply = {kind:'coach',reason:'everyday_parenting',language:'en',acknowledgment:'STUB acknowledgment',steps:['STUB first step','STUB second step'],checkIn:'STUB question?'};
  const server = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw);
    received.push({body, origin:req.headers.origin});
    const text = body.transcript.at(-1).text;
    res.setHeader('Content-Type','application/json');
    if (text === 'http') { res.statusCode = 503; res.end(JSON.stringify({private:'DO NOT STORE PROVIDER BODY'})); }
    else if (text === 'schema') res.end(JSON.stringify({private:'DO NOT STORE INVALID BODY'}));
    else if (text === 'identity') res.end(JSON.stringify({ok:true,requestId:'00000000-0000-4000-8000-000000000000',reply}));
    else res.end(JSON.stringify({ok:true,requestId:body.requestId,reply}));
  });
  await new Promise<void>(r => server.listen(0,'127.0.0.1',r));
  const address = server.address() as {port:number};
  const origin = `http://127.0.0.1:${address.port}`;
  const turn = (text:string, expectedKinds=['coach'], expectedReasons=['everyday_parenting']) => ({text,expectedKinds,expectedReasons,reviewNotes:'STUB ONLY'});
  const fixtures = [
    {id:'chain',family:1,replyLanguage:'en',turns:[turn('first'),turn('second')]},
    ...['http','schema','identity'].map(id=>({id,family:1,replyLanguage:'en',turns:[turn(id),turn('must not send')]})),
    {id:'mismatch',family:3,replyLanguage:'en',turns:[turn('mismatch',['clarify'],['missing_context']),turn('must not send')]},
  ];
  const fixture = join(dir,'fixtures.json');
  await writeFile(fixture,JSON.stringify(fixtures));
  const run = () => new Promise<number|null>((resolveRun,reject) => {
    const child = spawn(process.execPath,[resolve('scripts/evaluate.mjs'),'--base-url',origin,'--fixtures',fixture,'--output',dir,'--evidence','stub','--settings-ref','STUB ONLY'],{stdio:'pipe'});
    let errors=''; child.stderr.on('data',chunk=>errors+=chunk);
    child.on('error',reject); child.on('close',code=>{ if(code!==1) reject(new Error(`expected mechanical failure exit 1, got ${code}: ${errors}`)); else resolveRun(code); });
  });
  try {
    await run();
    const files = (await readdir(dir)).filter(f=>f.startsWith('stub-')&&f.endsWith('.json'));
    expect(files).toHaveLength(1);
    const original = await readFile(join(dir,files[0]),'utf8');
    const report = JSON.parse(original);
    expect(report.evidence).toBe('stub');
    expect(report.semanticReview).toBe('pending');
    expect(report.runs.map((r:any)=>r.failure)).toEqual([null,'http','schema','request_id','route_mismatch']);
    expect(report.runs.map((r:any)=>r.requests.length)).toEqual([2,1,1,1,1]);
    expect(report.modelSettingsReference).toBe('STUB ONLY');
    expect(report.runs.every((r:any)=>r.requests.every((q:any)=>q.durationMs >= 0))).toBe(true);
    expect(received[1].body.transcript).toEqual([{role:'user',text:'first'},{role:'assistant',reply},{role:'user',text:'second'}]);
    expect(received.every(r=>r.origin===origin)).toBe(true);
    expect(original).not.toContain('DO NOT STORE');
    await run();
    const reruns = (await readdir(dir)).filter(f=>f.startsWith('stub-')&&f.endsWith('.json'));
    expect(reruns).toHaveLength(2);
    const later = JSON.parse(await readFile(join(dir,reruns.find(f=>f!==files[0])!),'utf8'));
    expect(later.runId).not.toBe(report.runId);
    expect(later.runs[0].attemptId).not.toBe(report.runs[0].attemptId);
    expect(await readFile(join(dir,files[0]),'utf8')).toBe(original);
  } finally {
    await new Promise<void>((r,e)=>server.close(err=>err?e(err):r()));
    await rm(dir,{recursive:true,force:true});
  }
});

