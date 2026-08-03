import "server-only";
import path from "node:path";
import {appendFileSync} from "node:fs";
import {firebaseAdminApp} from "@/lib/firebase/admin";
import {createSafeRuntimeFingerprint,runtimeDebugEnabled} from "./runtime-debug-core.mjs";

const projectRoot=path.resolve(process.cwd());
export function towerRuntimeFingerprint(){return createSafeRuntimeFingerprint({appName:firebaseAdminApp.name,projectId:firebaseAdminApp.options.projectId,databaseURL:firebaseAdminApp.options.databaseURL,packageVersion:"0.1.0",projectRoot});}
export function logTowerRuntime(operation:string,towerKey:string,details:{path:string;exists?:boolean;branch?:string}){if(!runtimeDebugEnabled())return;const entry={operation,towerKey,...details,fingerprint:towerRuntimeFingerprint()};console.info("[TowerRuntimeDebug]",entry);appendFileSync(path.join(projectRoot,".tower-runtime-debug.log"),`${JSON.stringify(entry)}\n`,{encoding:"utf8"});}
export {runtimeDebugEnabled};