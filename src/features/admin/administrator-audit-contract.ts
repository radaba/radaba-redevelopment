import * as runtime from "./administrator-audit-contract.mjs";
export type AdministratorAuditSnapshot=Record<string,unknown>;
export interface AdministratorAuditInput { administratorIdentifier:string; administratorEmail:string; action:string; resourceType:string; resourceIdentifier:string; summary:string; before:AdministratorAuditSnapshot; after:AdministratorAuditSnapshot; requestIdentifier:string; ipAddress?:string|null; userAgent?:string|null }
export interface PreparedAdministratorAudit extends AdministratorAuditInput { ipAddress:string|null; userAgent:string|null }
export interface AdministratorAuditRecord extends PreparedAdministratorAudit { auditId:string; timestamp:string }
export interface AdministratorAuditAppendRepository { append(input:PreparedAdministratorAudit):Promise<AdministratorAuditRecord> }
export const sanitizeAdministratorAuditSnapshot=runtime.sanitizeAdministratorAuditSnapshot as (value:unknown)=>unknown;
export const prepareAdministratorAudit=runtime.prepareAdministratorAudit as (input:AdministratorAuditInput)=>PreparedAdministratorAudit;
export const createAdministratorAuditRecord=runtime.createAdministratorAuditRecord as (auditId:string,timestamp:string,input:PreparedAdministratorAudit)=>AdministratorAuditRecord;
export const recordAdministratorAudit=runtime.recordAdministratorAudit as (repository:AdministratorAuditAppendRepository,input:AdministratorAuditInput,log?:(message:string,context:Record<string,string>)=>void)=>Promise<{recorded:boolean}>;
