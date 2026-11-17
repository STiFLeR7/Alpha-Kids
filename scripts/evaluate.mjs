import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { join } from 'node:path';
import { CoachRequestSchema, PublicResponseSchema } from '../lib/contracts.ts';

const { values } = parseArgs({options:{
  'base-url':{type:'string',default:'http://127.0.0.1:3000'},
  fixtures:{type:'string',default:'tests/fixtures/scenarios.json'},
  output:{type:'string',default:'docs/evaluation'},
  evidence:{type:'string',default:'live'},
  'settings-ref':{type:'string',default:'ARCHITECTURE.md provider preflight (actual settings unverified)'},
}});
const base = new URL(values['base-url']);
if (base.protocol !== 'http:' || !['127.0.0.1','localhost','[::1]'].includes(base.hostname) || base.username || base.password || base.search || base.hash || base.pathname !== '/') {
  throw new Error('Use a plain HTTP loopback origin without credentials, path or query');
}
if (!['stub','live'].includes(values.evidence)) throw new Error('Evidence must be stub or live');
const fixtures = JSON.parse(await readFile(values.fixtures,'utf8'));
const ids = new Set();
for (const scenario of fixtures) {
  if (!scenario.id || ids.has(scenario.id) || !scenario.family || !['en','ur','auto'].includes(scenario.replyLanguage) || !scenario.turns?.length) throw new Error('Invalid scenario fixture');
  ids.add(scenario.id);
  for (const turn of scenario.turns) {
    if (!turn.text || !turn.expectedKinds?.length || !turn.expectedReasons?.length || !turn.reviewNotes) throw new Error('Missing turn expectations');
  }
}
const report = {
  runId:randomUUID(),date:new Date().toISOString(),evidence:values.evidence,
  input:'fictional synthetic conversations only',semanticReview:'pending',
  modelSettingsReference:values['settings-ref'],runs:[],
};
await mkdir(values.output,{recursive:true});
const path = join(values.output,`${report.evidence}-${report.date.replaceAll(':','-')}-${report.runId}.json`);
// Exclusive writes and a fresh UUID preserve every failed run and explicit rerun.
await writeFile(path,JSON.stringify(report,null,2),{flag:'wx'});
for (const scenario of fixtures) {
  const run = {scenarioId:scenario.id,repeatOf:scenario.repeatOf ?? null,family:scenario.family,attemptId:randomUUID(),requests:[],failure:null,semanticReview:'pending'};
  report.runs.push(run);
  const transcript = [];
  for (const [index, turn] of scenario.turns.entries()) {
    transcript.push({role:'user',text:turn.text});
    const request = CoachRequestSchema.parse({requestId:randomUUID(),replyLanguage:scenario.replyLanguage,transcript});
    const record = {turn:index+1,request:structuredClone(request),expectedKinds:turn.expectedKinds,expectedReasons:turn.expectedReasons,reviewNotes:turn.reviewNotes,status:null,durationMs:0,response:null,checks:{schema:false,requestId:false,route:false,language:null},failure:null};
    run.requests.push(record);
    const start = performance.now();
    try {
      const response = await fetch(new URL('/api/coach',base),{method:'POST',headers:{'Content-Type':'application/json',Origin:base.origin},body:JSON.stringify(request),signal:AbortSignal.timeout(35000)});
      record.status = response.status;
      let parsed;
      try { parsed = PublicResponseSchema.safeParse(await response.json()); } catch { parsed = {success:false}; }
      record.checks.schema = parsed.success;
      if (parsed.success) record.response = parsed.data;
      if (!response.ok) record.failure = 'http';
      else if (!parsed.success) record.failure = 'schema';
      else {
        const body = parsed.data;
        record.checks.requestId = body.requestId === request.requestId;
        if (!record.checks.requestId) record.failure = 'request_id';
        else if (!body.ok) record.failure = 'unavailable';
        else {
          record.checks.route = turn.expectedKinds.includes(body.reply.kind) && turn.expectedReasons.includes(body.reply.reason);
          record.checks.language = scenario.replyLanguage === 'auto' ? null : body.reply.language === scenario.replyLanguage;
          if (!record.checks.route) record.failure = 'route_mismatch';
          else if (record.checks.language === false) record.failure = 'language_mismatch';
          else transcript.push({role:'assistant',reply:body.reply});
        }
      }
    } catch {
      // Never serialize exception text: transport/provider internals can contain secrets.
      record.failure = 'transport';
    } finally { record.durationMs = Math.round(performance.now()-start); }
    run.failure = record.failure;
    await writeFile(path,JSON.stringify(report,null,2));
    if (record.failure) break;
  }
}
console.log(`${report.evidence} evidence: ${path}; ${report.runs.length} scenarios; semantic review pending`);
process.exitCode = report.runs.some(run=>run.failure) ? 1 : 0;
