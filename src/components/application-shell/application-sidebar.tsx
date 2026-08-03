"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { getActiveNavigationItem, getVisibleNavigation } from "./navigation-config";

export function ApplicationSidebar({
  collapsed,
  onToggle,
  isAdministrator,
  canAccessAssignments,
}: {
  collapsed: boolean;
  onToggle: () => void;
  isAdministrator: boolean;
  canAccessAssignments: boolean;
}) {
  const pathname = usePathname();
  const navigation = getVisibleNavigation(isAdministrator, canAccessAssignments);
  const activeItem = getActiveNavigationItem(pathname, navigation);
  return (
    <aside
      className={`hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-slate-950 text-white transition-[width] duration-200 lg:sticky lg:top-0 lg:flex ${collapsed ? "w-20" : "w-64"}`}
    >
      <div
        className={`flex h-18 items-center border-b border-white/10 ${collapsed ? "justify-center px-3" : "gap-3 px-5"}`}
      >
        <Image src="/favicon.ico" alt="" width={38} height={38} className="rounded-xl" priority />
        {collapsed ? (
          <span className="sr-only">Radaba</span>
        ) : (
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">Radaba</p>
            <p className="truncate text-xs text-slate-400">Engineering operations</p>
          </div>
        )}
      </div>
      <nav
        aria-label="Primary navigation"
        className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3"
      >
        {navigation.map((item, index) => {
          const active = activeItem?.id === item.id;
          const Icon = item.icon;
          const showSection = item.section && navigation[index - 1]?.section !== item.section;
          return (
            <div key={item.id}>
              {showSection ? (
                <p
                  className={`pb-2 pt-5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500 ${collapsed ? "text-center" : "px-3"}`}
                >
                  {collapsed ? "Admin" : item.section}
                </p>
              ) : null}
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={`group flex min-h-11 items-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${active ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                {collapsed ? (
                  <span className="sr-only">{item.label}</span>
                ) : (
                  <span>{item.label}</span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className={`flex min-h-10 w-full items-center rounded-xl text-sm text-slate-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400 ${collapsed ? "justify-center" : "justify-between px-3"}`}
        >
          {!collapsed ? <span>Collapse sidebar</span> : null}
          {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
        </button>
      </div>
    </aside>
  );
}
