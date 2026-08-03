import type { ProfileEditable } from "@/features/profile/profile-contract";

export interface SelfProfileRecord extends ProfileEditable {
  key: string;
  uid: string;
  email: string;
  role: string;
  status: string;
  company: string;
  department: string;
  region: string;
  photoUrl: string;
  photoName: string;
  photoStoragePath: string;
  photoUpdatedAt: string;
}

export interface ProfileUpdateResult {
  status: "updated" | "unchanged" | "profile_changed" | "transaction_conflict" | "not_found";
  profile?: SelfProfileRecord;
  before?: ProfileEditable;
  changedFields?: Array<keyof ProfileEditable>;
}
export interface ProfileRepository {
  findByUid(authUid: string): Promise<SelfProfileRecord[]>;
  findByEmail(email: string): Promise<SelfProfileRecord[]>;
  updateEditable(
    userKey: string,
    expected: ProfileEditable,
    next: ProfileEditable,
  ): Promise<ProfileUpdateResult>;
}
