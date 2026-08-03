'use client';

import Image from "next/image";

export function RadabaBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-sm backdrop-blur-sm">
        <Image
          src="/favicon.ico"
          alt="Radaba logo"
          width={40}
          height={40}
          priority
        />
      </div>
      <div>
        <p className="text-xl font-semibold tracking-tight">Radaba</p>
        <p className="text-sm text-indigo-100/90">Engineering operations</p>
      </div>
    </div>
  );
}
