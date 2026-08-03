"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getActiveNavigationItem, getVisibleNavigation } from "./navigation-config";

export function MobileNavigation({
  open,
  onClose,
  isAdministrator,
  canAccessAssignments,
}: {
  open: boolean;
  onClose: () => void;
  isAdministrator: boolean;
  canAccessAssignments: boolean;
}) {
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const navigation = getVisibleNavigation(isAdministrator, canAccessAssignments);
  const activeItem = getActiveNavigationItem(pathname, navigation);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", keydown);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation overlay"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className="relative flex h-full w-[min(20rem,88vw)] flex-col bg-slate-950 text-white"
      >
        <div className="flex h-18 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <Image
              src="/favicon.ico"
              alt=""
              width={38}
              height={38}
              className="rounded-xl"
              priority
            />
            <div>
              <p className="font-semibold">Radaba</p>
              <p className="text-xs text-slate-400">Engineering operations</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-2 focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav
          aria-label="Mobile primary navigation"
          className="flex-1 space-y-1 overflow-y-auto p-4"
        >
          {navigation.map((item, index) => {
            const active = activeItem?.id === item.id;
            const Icon = item.icon;
            const showSection = item.section && navigation[index - 1]?.section !== item.section;
            return (
              <div key={item.id}>
                {showSection ? (
                  <p className="px-3 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {item.section}
                  </p>
                ) : null}
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-400 ${active ? "bg-indigo-600" : "text-slate-300 hover:bg-white/10"}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
