import { buildLegacyUserSessionPayload as buildLegacyUserSessionPayloadFromModule } from './compat.mjs';

const compatModule = {
  buildLegacyUserSessionPayload: buildLegacyUserSessionPayloadFromModule,
};

export { buildLegacyUserSessionPayloadFromModule as buildLegacyUserSessionPayload };
export default compatModule;
