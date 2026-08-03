'use client';

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { getNavigationItem } from "./navigation-config";

export function Breadcrumb() {
  const pathname = usePathname();
  const current = getNavigationItem(pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
      <Link href="/home/assignment" className="rounded px-1 py-0.5 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
        Home
      </Link>
      {current ? (
        <>
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
          <span aria-current="page" className="font-medium text-slate-700">{current.label}</span>
        </>
      ) : null}
    </nav>
  );
}
