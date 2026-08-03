import "server-only";
import type { AdminPrivilegeRecord } from "@/features/admin/admin-types";
import { authMismatchWarnings,buildAdminUserDetail,emptyAdminAuthMetadata,usableFirebaseUid,type AdminUserDetailDto,type AdminUserDetailRecord } from "@/features/admin/admin-user-detail";
import type { AdminAuthMetadataGateway } from "./admin-auth-metadata-gateway";
export interface AdminUserDetailRepository { findUserDetail(userKey:string):Promise<AdminUserDetailRecord|null>; listPrivileges():Promise<AdminPrivilegeRecord[]> }
export class AdminUserDetailService { constructor(private readonly repository:AdminUserDetailRepository,private readonly auth:AdminAuthMetadataGateway){} async read(userKey:string,actor:{uid?:unknown;email?:unknown}):Promise<AdminUserDetailDto|null>{const user=await this.repository.findUserDetail(userKey);if(!user)return null;const uid=usableFirebaseUid(user.uid);const [privileges,auth]=await Promise.all([this.repository.listPrivileges(),uid?this.auth.read(uid):Promise.resolve(emptyAdminAuthMetadata("no_uid"))]);const detail=buildAdminUserDetail(user,privileges,actor);return {...detail,auth,warnings:[...detail.warnings,...authMismatchWarnings(user,auth)]};} }
