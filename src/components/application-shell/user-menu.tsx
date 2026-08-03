"use client";

import { ChevronDown, UserRound } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/authentication/logout-button";
import type { ApplicationShellUser } from "./application-shell";

interface UserMenuProps {
  user: ApplicationShellUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof MouseEvent && menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const initials =
    user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "R";
  const photo = user.photoUrl
    ? `${user.photoUrl}${user.photoUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(user.photoUpdatedAt ?? "")}`
    : "";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open user menu"
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <span
          className="relative flex h-9 w-9 overflow-hidden rounded-xl bg-indigo-100"
          aria-hidden="true"
        >
          {photo ? (
            <Image src={photo} alt="" fill sizes="36px" unoptimized className="object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-xs font-bold text-indigo-700">
              {initials}
            </span>
          )}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-40 truncate text-sm font-semibold text-slate-900">
            {user.name}
          </span>
          <span className="block max-w-40 truncate text-xs text-slate-500">{user.role}</span>
        </span>
        <ChevronDown aria-hidden="true" className="hidden h-4 w-4 text-slate-500 sm:block" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10"
        >
          <div className="flex gap-3 border-b border-slate-100 px-2 pb-3">
            {photo ? (
              <span className="relative size-10 shrink-0 overflow-hidden rounded-xl">
                <Image src={photo} alt="" fill sizes="40px" unoptimized className="object-cover" />
              </span>
            ) : (
              <UserRound aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <p className="mt-1 text-xs font-medium text-indigo-700">{user.role}</p>
            </div>
          </div>
          <div className="pt-3" role="none">
            <LogoutButton />
          </div>
        </div>
      ) : null}
    </div>
  );
}
