import type { AdminAuthMetadata } from "@/features/admin/admin-user-detail";
export interface AdminAuthMetadataGateway { read(uid:string):Promise<AdminAuthMetadata> }
