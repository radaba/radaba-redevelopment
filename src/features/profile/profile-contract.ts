import * as runtime from "./profile-contract.mjs";

export interface ProfileEditable {
  name: string;
  phone: string;
}
export interface ValidProfileUpdate extends ProfileEditable {
  expected: ProfileEditable;
}
export type ProfileValidationResult =
  { success: true; value: ValidProfileUpdate } | { success: false; code: string; message: string };
export const normalizeProfileEditable = runtime.normalizeProfileEditable as (
  value?: unknown,
) => ProfileEditable;
export const validateProfileUpdate = runtime.validateProfileUpdate as (
  value: unknown,
) => ProfileValidationResult;
export const profileChangedFields = runtime.profileChangedFields as (
  before: ProfileEditable,
  after: ProfileEditable,
) => Array<keyof ProfileEditable>;
