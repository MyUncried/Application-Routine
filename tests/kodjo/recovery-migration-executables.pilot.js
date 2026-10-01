'use strict';
// The implementation review workflow is a protocol executable: changes to it between a
// recovery package source_head and its certified anchor must be classifiable (PRE-1 round 4).
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','..','scripts','kodjo','lib','recovery-migration.js'),'utf8');
const start=source.indexOf('function isCertifiedExecutablePath(');
const end=source.indexOf('\nfunction ',start+1);
const ctx={};vm.createContext(ctx);
vm.runInContext(source.slice(start,end)+'\nthis.f=isCertifiedExecutablePath;',ctx);

test('protocol executables are certifiable, application and other workflows are not',()=>{
  for(const p of ['.github/workflows/kodjo-slice-implementation-review.yml','.github/workflows/kodjo-v2-lean-queue.yml','.github/workflows/kodjo-slice-plan.yml','scripts/kodjo/x.js','tests/kodjo/x.pilot.js'])assert.equal(ctx.f(p),true,p);
  for(const p of ['.github/workflows/kodjo-slice-implementation.yml','.github/workflows/routine-stable-sync.yml','src/app.ts','app/_layout.tsx','package.json'])assert.equal(ctx.f(p),false,p);
});
