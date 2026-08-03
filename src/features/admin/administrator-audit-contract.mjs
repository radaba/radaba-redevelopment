const SENSITIVE_KEY=/(password|token|cookie|secret|credential|private.?key|custom.?claims|session|authorization)/i;
const text=(value,maximum)=>String(value??"").trim().slice(0,maximum);
export function sanitizeAdministratorAuditSnapshot(value,depth=0){
 if(value===null||typeof value==="boolean"||typeof value==="number")return value;
 if(typeof value==="string")return value.slice(0,1000);
 if(depth>=4)return "[truncated]";
 if(Array.isArray(value))return value.slice(0,50).map((item)=>sanitizeAdministratorAuditSnapshot(item,depth+1));
 if(typeof value!=="object")return String(value).slice(0,1000);
 return Object.fromEntries(Object.entries(value).filter(([key])=>!SENSITIVE_KEY.test(key)).slice(0,50).map(([key,item])=>[key,sanitizeAdministratorAuditSnapshot(item,depth+1)]));
}
export function prepareAdministratorAudit(input){return {administratorIdentifier:text(input.administratorIdentifier,128),administratorEmail:text(input.administratorEmail,320),action:text(input.action,100),resourceType:text(input.resourceType,100),resourceIdentifier:text(input.resourceIdentifier,256),summary:text(input.summary,500),before:sanitizeAdministratorAuditSnapshot(input.before??{}),after:sanitizeAdministratorAuditSnapshot(input.after??{}),requestIdentifier:text(input.requestIdentifier,128),ipAddress:text(input.ipAddress,128)||null,userAgent:text(input.userAgent,500)||null};}
export function createAdministratorAuditRecord(auditId,timestamp,input){return {auditId,timestamp,...input};}
export async function recordAdministratorAudit(repository,input,log=console.error){const prepared=prepareAdministratorAudit(input);try{await repository.append(prepared);return {recorded:true};}catch{return log("Administrator audit recording failed",{action:prepared.action,resourceType:prepared.resourceType,resourceIdentifier:prepared.resourceIdentifier,requestIdentifier:prepared.requestIdentifier}),{recorded:false};}}
