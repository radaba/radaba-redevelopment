"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import type { AssignmentComment } from "@/features/assignment/assignment-comment-contract";

const endpoint = (id: string) => `/api/assignments/${encodeURIComponent(id)}/comments`;
const merge = (items: AssignmentComment[], item: AssignmentComment) =>
  [...new Map([...items, item].map((entry) => [entry.id, entry])).values()]
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
const timestamp = (value: number) => new Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  hour12: false, timeZone: "Asia/Jakarta",
}).format(new Date(value));

export function AssignmentDiscussion({ assignmentId, readOnly }: { assignmentId: string; readOnly: boolean }) {
  const [comments, setComments] = useState<AssignmentComment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const load = useCallback(async (before?: string) => {
    const container = listRef.current, previousHeight = container?.scrollHeight ?? 0;
    const response = await fetch(`${endpoint(assignmentId)}${before ? `?before=${encodeURIComponent(before)}` : ""}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || body.message || "Discussion could not be loaded.");
    setComments((current) => before ? [...body.data.comments, ...current] : body.data.comments);
    setCursor(body.data.nextCursor);
    requestAnimationFrame(() => {
      if (!container) return;
      if (before) container.scrollTop += container.scrollHeight - previousHeight;
      else container.scrollTop = container.scrollHeight;
    });
  }, [assignmentId]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((cause) => setError(cause instanceof Error ? cause.message : "Discussion could not be loaded.")).finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    const source = new EventSource(`${endpoint(assignmentId)}/stream`);
    source.addEventListener("comment", (event) => {
      const item = JSON.parse((event as MessageEvent).data) as AssignmentComment;
      setComments((current) => merge(current, item));
      if (nearBottom.current) requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
    });
    source.onerror = () => setError((current) => current || "Realtime connection interrupted. Reconnecting…");
    source.onopen = () => setError((current) => current.startsWith("Realtime") ? "" : current);
    return () => source.close();
  }, [assignmentId]);
  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (pending) return;
    setPending(true); setError("");
    try {
      const response = await fetch(endpoint(assignmentId), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, clientRequestId: crypto.randomUUID() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || body.message || "Comment could not be sent.");
      setComments((current) => merge(current, body.data)); setMessage("");
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Comment could not be sent."); }
    finally { setPending(false); }
  }
  async function change(item: AssignmentComment, method: "PATCH" | "DELETE") {
    const next = method === "PATCH" ? window.prompt("Edit comment", item.message) : null;
    if (method === "PATCH" && next === null) return;
    if (method === "DELETE" && !window.confirm("Delete this comment? It will remain in the Assignment history as deleted.")) return;
    const response = await fetch(`${endpoint(assignmentId)}/${encodeURIComponent(item.id)}`, { method, headers: { "Content-Type": "application/json" }, ...(method === "PATCH" ? { body: JSON.stringify({ message: next }) } : {}) });
    const body = await response.json();
    if (!response.ok) { setError(body.error || body.message || "Comment could not be changed."); return; }
    await load();
  }
  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); }
  }
  return (
    <section aria-labelledby="assignment-discussion" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5"><h2 id="assignment-discussion" className="flex items-center gap-2 text-sm font-semibold text-slate-950"><MessageSquare className="size-4 text-indigo-700" />Discussion</h2><p className="mt-1 text-xs text-slate-500">Operational comments for this Assignment.</p></header>
      {cursor ? <button type="button" onClick={() => void load(cursor)} className="mx-auto my-3 block min-h-10 rounded-lg border px-3 text-sm font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500">Load older comments</button> : null}
      <div ref={listRef} onScroll={(event) => { const node = event.currentTarget; nearBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 96; }} className="max-h-[32rem] min-h-48 overflow-y-auto px-4 sm:px-5" aria-live="polite">
        {loading ? <p role="status" className="py-8 text-center text-sm text-slate-500">Loading discussion…</p> : comments.length ? <ol className="divide-y divide-slate-100">{comments.map((item) => <li key={item.id} className="flex gap-3 py-4"><span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials(item.authorName)}</span><article className="min-w-0 flex-1"><header className="flex flex-wrap items-baseline gap-x-2"><h3 className="text-sm font-semibold">{item.authorName}</h3><span className="text-xs text-slate-500">{item.role}</span><time dateTime={new Date(item.createdAt).toISOString()} className="text-xs text-slate-500">{timestamp(item.createdAt)}</time>{item.editedAt ? <span className="text-xs text-slate-400">(edited)</span> : null}</header><p className={`mt-1 whitespace-pre-wrap break-words text-sm ${item.deleted ? "italic text-slate-400" : "text-slate-800"}`}>{item.deleted ? "Comment deleted" : item.message}</p>{!readOnly && !item.deleted && (item.canEdit || item.canDelete) ? <div className="mt-2 flex gap-3 text-xs">{item.canEdit ? <button type="button" onClick={() => void change(item, "PATCH")} className="font-semibold text-indigo-700 focus-visible:ring-2">Edit</button> : null}{item.canDelete ? <button type="button" onClick={() => void change(item, "DELETE")} className="inline-flex items-center gap-1 font-semibold text-rose-700 focus-visible:ring-2"><Trash2 className="size-3" />Delete</button> : null}</div> : null}</article></li>)}</ol> : <p className="py-8 text-center text-sm text-slate-500">No comments yet. Start the operational discussion.</p>}
      </div>
      {error ? <p role="alert" className="mx-4 mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 sm:mx-5">{error}</p> : null}
      {readOnly ? <p className="border-t bg-slate-50 px-4 py-4 text-sm text-slate-600 sm:px-5">Discussion is read-only because this Assignment is completed. Revisit the Assignment to comment again.</p> : <form onSubmit={(event) => void submit(event)} className="border-t border-slate-100 p-4 sm:p-5"><label htmlFor="assignment-comment" className="sr-only">Comment message</label><textarea id="assignment-comment" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={keyDown} maxLength={2000} rows={3} placeholder="Write a comment…" className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" /><div className="mt-2 flex items-center justify-between gap-3"><p className="text-xs text-slate-500">Enter to send · Shift+Enter for a new line · {message.length}/2000</p><button type="submit" disabled={pending || !message.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-indigo-500"><Send className="size-4" />{pending ? "Sending…" : "Send"}</button></div></form>}
    </section>
  );
}
