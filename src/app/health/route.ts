import { response, snapshot } from "@/server/operations/health-route";
export const dynamic="force-dynamic";
export async function GET(){const {config,health}=snapshot();if(!config.healthEndpointsEnabled)return response({status:"not_found"},404);return response({status:health.status,live:health.live,ready:health.ready,checks:health.checks},health.live?200:503);}