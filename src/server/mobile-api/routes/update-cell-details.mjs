import { legacyFailure, legacySuccess } from "../compatibility/response.mjs";

export const createUpdateCellDetailsHandler = (service) => async (request) => {
  try {
    return legacySuccess(await service.update(await request.json()));
  } catch (error) {
    return legacyFailure(500, "failed", error?.message);
  }
};
