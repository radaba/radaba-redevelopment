'use client';

import { useApplicationShellUser } from "@/components/application-shell/application-shell";
import { ProfileWorkspace } from "./profile-workspace";

export default function ProfilePage() {
  return <ProfileWorkspace user={useApplicationShellUser()} />;
}