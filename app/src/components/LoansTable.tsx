import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, ChevronLeft, ChevronRight, ChevronDown, ListTodo, StickyNote,
  Folder, Download, CalendarClock, CirclePlus, CheckCircle2,
} from "lucide-react";
import { fmtMoney, netCommission } from "../data/mock";
import type { Loan } from "../data/mock";
import { useWorkspace } from "../state/workspace";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PER_PAGE_OPTIONS = [5, 10, 25];

function DateCell({ value, done }: { value: string | null; done?: boolean }) {
  if (value) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        {value}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${done ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
      <CalendarClock className="h-3.5 w-3.5" />
      No date set
    </span>
  );
}

export default function LoansTable({ data, title }: { data: Loan[]; title: string }) {
  const { openPanel, pushToast } = useWorkspace();
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState<string | null>("Jul");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const types = useMemo(() => ["All Types", ...Array.from(new Set(data.map((l) => l.type)))], [data]);

  const filtered = useMemo(() => {
    return data.filter((l) => {
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        l.borrower.toLowerCase().includes(q) ||
        l.id.includes(q) ||
        l.primaryLO.toLowerCase().includes(q);
      const matchM =
        !month ||
        (l.fundedDate && new Date(l.fundedDate).getMonth() === MONTHS.indexOf(month)) ||
        (!l.fundedDate && new Date(l.loanExpDate).getMonth() === MONTHS.indexOf(month));
      const matchT = typeFilter === "All Types" || l.type === typeFilter;
      return matchQ && matchM && matchT;
    });
  }, [data, query, month, typeFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const exportCsv = () => {
    const header = "Arive ID,Borrower,Status,Funded Date,Primary LO,State,Net Commission\n";
    const body = filtered
      .map((l) => `${l.id},"${l.borrower}",${l.status},${l.fundedDate || "—"},"${l.primaryLO}",${l.state},${netCommission(l)}`)
      .join("\n");
    const url = URL.createObjectURL(new Blob([header + body], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "loans-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    pushToast(`Exported ${filtered.length} loans to CSV`);
  };

  const clear = () => {
    setQuery("");
    setMonth(null);
    setTypeFilter("All Types");
    setPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="card-shadow overflow-hidden rounded-2xl border border-border bg-card"
    >
      {/* Toolbar */}
      <div className="border-b border-border bg-white/60 px-5 py-4">
        <div className="flex w-full flex-wrap items-center gap-3 xl:flex-nowrap">
          <div className="relative w-full sm:w-auto sm:min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search borrower, LO, ID…"
              className="h-10 w-full rounded-full border border-input bg-white pl-9 pr-4 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 sm:w-64"
            />
          </div>

          <div className="relative w-full sm:w-auto sm:min-w-[220px]">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full appearance-none rounded-full border border-input bg-white pl-4 pr-9 text-sm font-medium outline-none transition focus:border-rose-400"
            >
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-full border border-input bg-white p-1">
            {MONTHS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMonth(month === m ? null : m);
                  setPage(1);
                }}
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  month === m
                    ? "bg-rose-700 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={clear}
              disabled={!query && !month && typeFilter === "All Types"}
              className="h-10 rounded-full px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-input bg-white px-4 text-xs font-semibold text-foreground shadow-sm transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left">
          <thead>
            <tr className="border-b border-border bg-stone-50/70 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              <th className="px-5 py-3">Arive ID</th>
              <th className="px-3 py-3">Borrower</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Funded Date</th>
              <th className="px-3 py-3">Calc. Completed</th>
              <th className="px-3 py-3">Payroll Processed</th>
              <th className="px-3 py-3">Primary LO</th>
              <th className="px-3 py-3">LO 2</th>
              <th className="px-3 py-3">LO 3</th>
              <th className="px-3 py-3">State</th>
              <th className="px-3 py-3 text-right">Net Comm.</th>
              <th className="px-5 py-3 text-center">Details · Notes · Files</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l, i) => (
              <motion.tr
                key={l.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.025 }}
                onClick={() => openPanel(l, "details")}
                className="row-hover cursor-pointer border-b border-border/70 last:border-0"
              >
                <td className="px-5 py-3.5 text-sm font-semibold tabular-nums text-muted-foreground">{l.id}</td>
                <td className="px-3 py-3.5 text-sm font-semibold text-foreground">{l.borrower}</td>
                <td className="px-3 py-3.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {l.status}
                  </span>
                </td>
                <td className="px-3 py-3.5 text-sm tabular-nums text-foreground/90">{l.fundedDate || "—"}</td>
                <td className="px-3 py-3.5"><DateCell value={l.calcCompleted} /></td>
                <td className="px-3 py-3.5"><DateCell value={l.payrollProcessed} /></td>
                <td className="px-3 py-3.5 text-sm font-medium">{l.primaryLO}</td>
                <td className="px-3 py-3.5 text-sm text-muted-foreground">{l.lo2 ?? <span className="italic opacity-60">No LO assigned</span>}</td>
                <td className="px-3 py-3.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); pushToast(`Assign LO 3 to ${l.borrower} — coming from LOS sync`); }}
                    className="grid h-6 w-6 place-items-center rounded-full border border-dashed border-stone-300 text-stone-400 transition hover:border-rose-400 hover:text-rose-600"
                  >
                    <CirclePlus className="h-4 w-4" />
                  </button>
                </td>
                <td className="px-3 py-3.5">
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-600">{l.state}</span>
                </td>
                <td className="px-3 py-3.5 text-right text-sm font-bold tabular-nums text-foreground">{fmtMoney(netCommission(l))}</td>
                <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <IconBtn label="Details" onClick={() => openPanel(l, "details")}><ListTodo className="h-4 w-4" /></IconBtn>
                    <IconBtn label="Notes" dot={l.hasNotes} onClick={() => openPanel(l, "notes")}><StickyNote className="h-4 w-4" /></IconBtn>
                    <IconBtn label="Files" onClick={() => openPanel(l, "files")}><Folder className="h-4 w-4" /></IconBtn>
                  </div>
                </td>
              </motion.tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className="px-5 py-16 text-center">
                  <p className="font-display text-lg font-bold text-foreground">No loans found</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters for “{title}”.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border bg-white/60 px-5 py-3.5">
        <span className="text-xs font-medium text-muted-foreground">Rows per page:</span>
        <div className="flex gap-1">
          {PER_PAGE_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => { setPerPage(n); setPage(1); }}
              className={`h-7 min-w-7 rounded-lg px-2 text-xs font-bold transition ${
                perPage === n ? "bg-rose-700 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {filtered.length === 0 ? 0 : (safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filtered.length)} of {filtered.length}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).slice(0, 5).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-7 min-w-7 rounded-lg px-2 text-xs font-bold transition ${
                safePage === p ? "bg-rose-700 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={safePage >= pages}
            onClick={() => setPage(safePage + 1)}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function IconBtn({ children, label, dot, onClick }: { children: React.ReactNode; label: string; dot?: boolean; onClick: () => void }) {
  return (
    <button
      title={label}
      onClick={onClick}
      className="relative grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-rose-50 hover:text-rose-700"
    >
      {children}
      {dot && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />}
    </button>
  );
}
