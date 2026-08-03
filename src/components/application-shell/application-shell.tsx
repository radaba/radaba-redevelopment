"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { ApplicationHeader } from "./application-header";
import { ApplicationSidebar } from "./application-sidebar";
import { MobileNavigation } from "./mobile-navigation";

export interface ApplicationShellUser {
  name: string;
  email: string;
  role: string;
  isAdministrator?: boolean;
  canAccessAssignments?: boolean;
  status?: string;
  company?: string;
  department?: string;
  region?: string;
  phone?: string;
  photoUrl?: string;
  photoUpdatedAt?: string;
}

const ApplicationShellUserContext = createContext<ApplicationShellUser | null>(null);

export function useApplicationShellUser() {
  const user = useContext(ApplicationShellUserContext);
  if (!user) throw new Error("useApplicationShellUser must be used within ApplicationShell");
  return user;
}

export function ApplicationShell({
  user,
  children,
}: {
  user: ApplicationShellUser;
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const closeMobileNavigation = useCallback(() => setMobileNavigationOpen(false), []);
  return (
    <ApplicationShellUserContext.Provider value={user}>
      <div className="flex min-h-screen min-w-0 bg-slate-100">
        <ApplicationSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((value) => !value)}
          isAdministrator={user.isAdministrator === true}
          canAccessAssignments={user.canAccessAssignments === true}
        />
        <MobileNavigation
          open={mobileNavigationOpen}
          onClose={closeMobileNavigation}
          isAdministrator={user.isAdministrator === true}
          canAccessAssignments={user.canAccessAssignments === true}
        />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <ApplicationHeader
            user={user}
            mobileNavigationOpen={mobileNavigationOpen}
            onOpenMobileNavigation={() => setMobileNavigationOpen(true)}
          />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </ApplicationShellUserContext.Provider>
  );
}
