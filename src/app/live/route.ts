import { response, snapshot } from "@/server/operations/health-route";
export const dynamic="force-dynamic";
export async function GET(){const {config}=snapshot();if(!config.healthEndpointsEnabled)return response({status:"not_found"},404);return response({status:"live"});}