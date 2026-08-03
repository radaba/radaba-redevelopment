import { FirebaseMobileSecurityRepository } from "./firebase-mobile-security-repository";
import { FirebaseMobileTokenVerifier } from "./firebase-mobile-token-verifier";
import { createMobileSecurityService } from "./service.mjs";
import { createSecureMobileHandler } from "./wrapper.mjs";
import { resolveOperationalConfig } from "@/server/operations/config.mjs";
import { createOperationalLogger, operationalRequestContext } from "@/server/operations/logging.mjs";
import { recordOperationalMetric } from "@/server/operations/metrics.mjs";

const service=createMobileSecurityService({verifier:new FirebaseMobileTokenVerifier(),repository:new FirebaseMobileSecurityRepository()});
export function secureMobileHandler(handler:(request:Request)=>Promise<Response>,route:string){const config=resolveOperationalConfig();return createSecureMobileHandler(handler,route,{service,operational:{compatibilityApiEnabled:config.compatibilityApiEnabled,context:config.monitoringEnabled?operationalRequestContext:undefined,logger:config.monitoringEnabled?createOperationalLogger():undefined,metric:config.monitoringEnabled?recordOperationalMetric:undefined}});}