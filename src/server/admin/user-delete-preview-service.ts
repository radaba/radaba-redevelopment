import "server-only";
import type { Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { buildUserDeletePreview } from "@/features/admin/user-delete-preview.mjs";
import type { AdminUserRecord } from "@/features/admin/admin-types";
const PATHS=["assignment","cell","image","assignment_photo","administrator_audit","assignment_audit","tower_audit","log"] as const;
export class UserDeletePreviewService { constructor(private readonly database:Database=firebaseAdminDatabase) {} async preview(user:AdminUserRecord) { const snapshots=await Promise.all(PATHS.map(path=>this.database.ref(path).once("value"))); return buildUserDeletePreview(user,Object.fromEntries(PATHS.map((path,index)=>[path,snapshots[index].val()]))); } }