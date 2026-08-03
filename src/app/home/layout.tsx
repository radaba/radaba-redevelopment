import { redirect } from "next/navigation";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { canAdministrate } from "@/features/admin/admin-authorization";
import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { ApplicationShell } from "@/components/application-shell/application-shell";

export const dynamic = "force-dynamic";

export default async function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let user;
  try {
    user = await resolveAuthenticatedUser();
  } catch {
    redirect("/login");
  }
  const isAdministrator = canAdministrate(user);
  const shellUser = {
    name: user.name || "Radaba user",
    email: user.email,
    role: user.role || "Unknown role",
    isAdministrator,
    canAccessAssignments:
      String(user.status).toLowerCase() === "active" &&
      canAccessAssignment(user.privilege, user.role),
    status: user.status,
    company: user.company,
    department: user.department,
    region: user.region,
    phone: user.phone,
    photoUrl: user.photo_url,
    photoUpdatedAt: user.photo_updated_at ?? user.updated_at,
  };
  return <ApplicationShell user={shellUser}>{children}</ApplicationShell>;
}
