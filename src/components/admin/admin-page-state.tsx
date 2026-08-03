export function AdminPermissionDenied() {
  return <section aria-labelledby="admin-denied" className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 id="admin-denied" className="text-xl font-semibold text-amber-950">Permission denied</h1><p className="mt-2 text-sm text-amber-800">Verified super administrator access is required.</p></section>;
}

export function AdminEmptyState({ title, description }: { title: string; description: string }) {
  return <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="font-semibold text-slate-950">{title}</h2><p className="mt-2 text-sm text-slate-600">{description}</p></section>;
}
