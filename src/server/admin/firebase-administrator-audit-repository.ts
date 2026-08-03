import "server-only";
import type { Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { createAdministratorAuditRecord,type AdministratorAuditAppendRepository,type AdministratorAuditRecord,type PreparedAdministratorAudit } from "@/features/admin/administrator-audit-contract";
const AUDIT_PATH="administrator_audit";
export class FirebaseAdministratorAuditRepository implements AdministratorAuditAppendRepository {
 constructor(private readonly database:Database=firebaseAdminDatabase,private readonly now:()=>Date=()=>new Date()){}
 async append(input:PreparedAdministratorAudit):Promise<AdministratorAuditRecord>{const reference=this.database.ref(AUDIT_PATH).push(),auditId=reference.key;if(!auditId)throw new Error("Audit identifier generation failed.");const record=createAdministratorAuditRecord(auditId,this.now().toISOString(),input);await reference.set(record);return record;}
}
