'use client';

import { Menu } from "lucide-react";
import { Breadcrumb } from "./breadcrumb";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "@/components/notification/notification-bell";
import { GlobalSearchPalette } from "@/components/search/global-search-palette";
import type { ApplicationShellUser } from "./application-shell";

interface ApplicationHeaderProps {
  user: ApplicationShellUser;
  mobileNavigationOpen: boolean;
  onOpenMobileNavigation: () => void;
}

export function ApplicationHeader({ user, mobileNavigationOpen, onOpenMobileNavigation }: ApplicationHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-18 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onOpenMobileNavigation} aria-label="Open navigation" aria-expanded={mobileNavigationOpen} className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden">
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
        <div className="min-w-0"><Breadcrumb /></div>
      </div>
      <div className="flex shrink-0 items-center gap-2"><GlobalSearchPalette /><NotificationBell /><UserMenu user={user} /></div>
    </header>
  );
}
