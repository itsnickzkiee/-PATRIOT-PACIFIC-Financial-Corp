import { useMemo, useState } from "react";
import { BookOpen, Search, ChevronRight } from "lucide-react";
import { useWorkspace } from "../state/workspace";

const ARTICLES = [
  { title: "How to manage funded loans", category: "Loans", body: "Review funded dates, commission details, notes, and uploaded files from the Funded Loans page." },
  { title: "How commission exports work", category: "Reports", body: "Use Export to download the currently filtered loans as a CSV file." },
  { title: "How to invite and manage users", category: "Administration", body: "Open User Management to invite users, update roles, and manage access." },
  { title: "Understanding loan statuses", category: "Loans", body: "Loan statuses show where each record is in the processing workflow." },
];

export default function KnowledgeBase() {
  const [query, setQuery] = useState("");
  const { pushToast } = useWorkspace();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ARTICLES.filter((a) => !q || a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-700"><BookOpen className="h-5 w-5" /></div>
          <div>
            <h2 className="font-display text-xl font-bold">Knowledge Base</h2>
            <p className="text-sm text-muted-foreground">Find quick guides for loans, commissions, users, and reports.</p>
          </div>
        </div>
        <div className="relative mt-5 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help articles..." className="h-10 w-full rounded-full border border-input bg-white pl-9 pr-4 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((article) => (
          <button key={article.title} onClick={() => pushToast(`${article.title}: ${article.body}`)} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">{article.category}</span>
              <h3 className="mt-1 font-semibold text-foreground">{article.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{article.body}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-rose-700" />
          </button>
        ))}
      </div>
    </div>
  );
}
