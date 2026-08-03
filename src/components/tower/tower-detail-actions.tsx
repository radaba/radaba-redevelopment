"use client";
import { Copy, ExternalLink } from "lucide-react";
export function TowerDetailActions({ towerId, coordinates }: { towerId: string; coordinates: { latitude:number; longitude:number } | null }) {
  const copy=(value:string)=>navigator.clipboard.writeText(value);
  return <div className="flex flex-wrap gap-2"><button type="button" onClick={()=>copy(towerId)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-indigo-500"><Copy className="size-4" aria-hidden="true"/>Copy Tower ID</button>{coordinates?<><button type="button" onClick={()=>copy(`${coordinates.latitude}, ${coordinates.longitude}`)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-indigo-500"><Copy className="size-4" aria-hidden="true"/>Copy Coordinates</button><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${coordinates.latitude},${coordinates.longitude}`)}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-700 px-3 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-indigo-500"><ExternalLink className="size-4" aria-hidden="true"/>Open in Google Maps</a></>:null}</div>;
}

