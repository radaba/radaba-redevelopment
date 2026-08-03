import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { androidRetrofitContracts, characterizedCosts, modeExpectations, stagingScenarios } from "../fixtures/mobile-staging-contract.js";
import { resolveMobileSecurityMode } from "../../src/server/mobile-api/security/config.mjs";

const root=process.cwd();
const read=(value)=>fs.readFileSync(path.join(root,value),"utf8");
const routeNames=()=>new Set(fs.readdirSync(path.join(root,"src/app/api/mobile"),{withFileTypes:true}).filter(x=>x.isDirectory()&&fs.existsSync(path.join(root,"src/app/api/mobile",x.name,"route.ts"))).map(x=>x.name));

test("Android Retrofit inventory has every declaration, method, request, response and parity state",()=>{assert.equal(androidRetrofitContracts.length,17);for(const row of androidRetrofitContracts){assert.equal(row.length,6);for(const value of row)assert.ok(value);}});
test("all Retrofit routes marked implemented exist with exact casing",()=>{const routes=routeNames();for(const [,method,route,,,status] of androidRetrofitContracts){if(status==="implemented"){assert.ok(routes.has(route),route);assert.match(read(`src/app/api/mobile/${route}/route.ts`),new RegExp(`\\b${method}\\b`));}}});
test("the three missing Android-called routes are explicit production blockers",()=>{assert.deepEqual(androidRetrofitContracts.filter(x=>x[5]==="missing").map(x=>x[2]),["getassignmentsActiveUploadFinish","getassignmentsActiveUploadFinishById","getCatalogs"]);});
test("all requested staging scenarios have an evidence status",()=>{assert.equal(stagingScenarios.length,16);assert.ok(stagingScenarios.every(x=>x.length===3&&x[2]));assert.equal(stagingScenarios.filter(x=>x[2]==="shadow-ready").length,12);});
test("deferred lifecycle and absent Android logout are never labelled ready",()=>{for(const name of ["Accept","Check-in","Close","Logout"]){assert.notEqual(stagingScenarios.find(x=>x[0]===name)?.[2],"shadow-ready");}});
test("security mode expectations match central configuration",()=>{for(const mode of Object.keys(modeExpectations))assert.equal(resolveMobileSecurityMode({MOBILE_API_SECURITY_MODE:mode}),mode);assert.equal(modeExpectations.enforce.androidWithoutBearer,false);});
test("production enforcement remains impossible",()=>{assert.throws(()=>resolveMobileSecurityMode({NODE_ENV:"production",MOBILE_API_SECURITY_MODE:"enforce"}),/not approved/);});
test("characterized operation counts are bounded and reads never imply writes",()=>{for(const value of Object.values(characterizedCosts)){assert.ok(Number.isInteger(value.reads)&&value.reads>=0);assert.ok(Number.isInteger(value.writes)&&value.writes>=0);assert.ok(Number.isInteger(value.fanout)&&value.fanout>=0);}assert.deepEqual(characterizedCosts.aorSummary,{reads:3,writes:0,fanout:0});});
test("shadow coverage retains compatibility, replay, failure, and security suites",()=>{const validation=read("scripts/validate.cmd");for(const suite of ["compatibility.test.js","assignment-transitions.test.js","assignment-finish.test.js","assignment-lifecycle-consolidation.test.js","cell-sector-writes.test.js","security-hardening.test.js","staging-readiness.test.js"])assert.match(validation,new RegExp(suite.replaceAll(".","\\.")));});
test("all M12R deliverables exist and record blockers rather than claiming cutover",()=>{for(const name of ["README.md","android-compatibility-matrix.md","shadow-validation.md","security-rollout.md","performance-results.md","staging-checklist.md","production-readiness.md"]){const source=read(`.docs/mobile-api-staging/${name}`);assert.match(source,/M12R|staging|Staging/i);assert.doesNotMatch(source,/production cutover (complete|approved)/i);}});
test("fixtures contain no operational endpoint, token, credential, or identifier",()=>{const source=read("tests/fixtures/mobile-staging-contract.js");assert.doesNotMatch(source,/https?:|Bearer\s+|eyJ[A-Za-z0-9_-]{20,}|password\\s*[:=]|gmail\.com|firebaseio/i);});