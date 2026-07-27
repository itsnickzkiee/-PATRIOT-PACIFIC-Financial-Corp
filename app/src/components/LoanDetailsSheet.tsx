import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  Printer,
  StickyNote,
  Folder,
  BadgeDollarSign,
  Copy,
  HelpCircle,
} from "lucide-react";
import Drawer from "./Drawer";
import { useWorkspace } from "../state/workspace";
import { fmtMoney } from "../data/mock";
import { useAuth } from "../state/AuthContext";

interface FieldProps {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  hint?: boolean;
  prefix?: string;
  readOnly?: boolean;
}

function Field({
  label,
  value,
  onChange,
  hint,
  prefix,
  readOnly = false,
}: FieldProps) {
  return (
    <label className="group block">
      <span className="mb-1.5 flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
        {hint && <HelpCircle className="h-3 w-3 text-rose-300" />}
      </span>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          value={value}
          onChange={(e) => {
            if (!readOnly) {
              onChange?.(e.target.value);
            }
          }}
          readOnly={readOnly}
          className={`h-10 w-full rounded-xl border border-input text-sm font-medium outline-none transition ${
            readOnly
              ? "cursor-not-allowed bg-stone-100 text-muted-foreground"
              : "bg-stone-50/60 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
          } ${prefix ? "pl-7 pr-3" : "px-3"}`}
        />
      </div>
    </label>
  );
}

function SectionTitle({
  children,
  tone = "rose",
}: {
  children: React.ReactNode;
  tone?: "rose" | "amber";
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${tone === "rose" ? "text-rose-700" : "text-amber-600"}`}
      >
        {children}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent" />
    </div>
  );
}

export default function LoanDetailsSheet() {
  const { user } = useAuth();
  const { activeLoan, panel, closePanel, openPanel, pushToast } =
    useWorkspace();

  const role = user?.role?.trim() ?? "";
  const isAdmin = role === "Super Admin" || role === "Admin";
  const canEditLoanDetails = isAdmin || role === "Processor";
  const canEditAccounting = isAdmin || role === "Accounting";
  const canSave = canEditLoanDetails || canEditAccounting;
  const open = panel === "details" && !!activeLoan;

  const [form, setForm] =
    useState<Record<string, string>>({});

  const [saving, setSaving] =
    useState(false);
  useEffect(() => {
    if (activeLoan) {
      setForm({
        borrower: activeLoan.borrower,
        url: "https://patriotpacific.myarive.com/loan/" + activeLoan.id,
        property: activeLoan.property,
        state: activeLoan.state,
        base: String(activeLoan.baseLoanAmount),
        total: String(activeLoan.totalLoanAmount),
        exp: activeLoan.loanExpDate,
        lock: String(activeLoan.lockPricing),
        a1: String(activeLoan.revenue.originationA1),
        a2: String(activeLoan.revenue.originationA2),
        a3: String(activeLoan.revenue.originationA3),
        points: String(activeLoan.revenue.pointsA01),
        ysp: String(activeLoan.revenue.ysp),
        lockCost: String(activeLoan.deductions.lockCost),
        lenderCredit: String(activeLoan.deductions.lenderCredit),
        flatFee: String(activeLoan.deductions.flatFee),
      });
    }
  }, [activeLoan]);

  const totals = useMemo(() => {
    const n = (k: string) => parseFloat(form[k] || "0") || 0;
    const revenue = n("a1") + n("a2") + n("a3") + n("points") + n("ysp");
    const deductions = n("lockCost") + n("lenderCredit") + n("flatFee");
    return { revenue, deductions, net: revenue - deductions };
  }, [form]);

  async function saveLoanChanges() {
    if (
      !activeLoan ||
      !user?.id ||
      !canSave ||
      saving
    ) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `http://localhost:5000/api/loans/${activeLoan.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            "x-user-id": String(user.id),
          },
          body: JSON.stringify({
            borrower:
              form.borrower?.trim() ||
              activeLoan.borrower,
            status: activeLoan.status,
            fundedDate:
              activeLoan.fundedDate ||
              null,
            calcCompleted:
              activeLoan.calcCompleted ||
              null,
            payrollProcessed:
              activeLoan.payrollProcessed ||
              null,
            primaryLO:
              activeLoan.primaryLO,
            lo2: activeLoan.lo2,
            lo3: activeLoan.lo3,
            state:
              form.state
                ?.trim()
                .toUpperCase() ||
              activeLoan.state,
            hasNotes:
              activeLoan.hasNotes,
            filesCount:
              activeLoan.filesCount,
            property:
              form.property?.trim() ||
              activeLoan.property,
            baseLoanAmount:
              Number(form.base || 0),
            totalLoanAmount:
              Number(form.total || 0),
            loanExpDate:
              form.exp?.trim() || null,
            lockPricing:
              Number(form.lock || 0),
            type: activeLoan.type,
            revenue: {
              originationA1:
                Number(form.a1 || 0),
              originationA2:
                Number(form.a2 || 0),
              originationA3:
                Number(form.a3 || 0),
              pointsA01:
                Number(form.points || 0),
              ysp:
                Number(form.ysp || 0),
            },
            deductions: {
              lockCost:
                Number(
                  form.lockCost || 0,
                ),
              lenderCredit:
                Number(
                  form.lenderCredit || 0,
                ),
              flatFee:
                Number(
                  form.flatFee || 0,
                ),
            },
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to save loan changes.",
        );
      }

      pushToast(
        `Changes saved to loan #${activeLoan.id}`,
      );

      closePanel();

      window.setTimeout(() => {
        window.location.reload();
      }, 350);
    } catch (error) {
      console.error(
        "Save loan changes error:",
        error,
      );

      pushToast(
        error instanceof Error
          ? error.message
          : "Unable to save loan changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!activeLoan) return null;
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Drawer
      open={open}
      onClose={closePanel}
      header={
        <>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display truncate text-lg font-bold text-white">
                Loan Details
              </h2>
              <span className="font-mono text-sm font-semibold text-amber-300">
                #{activeLoan.id}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-rose-100 ring-1 ring-white/20">
                {activeLoan.type}
              </span>
            </div>
            <p className="truncate text-xs text-rose-100/60">
              {activeLoan.borrower} · {activeLoan.state}
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-1 sm:flex">
            {[
              { icon: BadgeDollarSign, label: "Payout" },
              { icon: Folder, label: "Files" },
              { icon: StickyNote, label: "Notes" },
            ].map((t) => (
              <button
                key={t.label}
                onClick={() =>
                  t.label === "Files"
                    ? openPanel(activeLoan, "files")
                    : t.label === "Notes"
                      ? openPanel(activeLoan, "notes")
                      : pushToast("Payout worksheet queued for generation")
                }
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-100/70 transition hover:bg-white/10 hover:text-white"
              >
                <t.icon className="mr-1 inline h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
            <button
              onClick={() => pushToast("Print preview opened")}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-100/70 transition hover:bg-white/10 hover:text-white"
            >
              <Printer className="mr-1 inline h-3.5 w-3.5" /> Print
            </button>
          </div>
        </>
      }
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        {/* Left: loan details */}
        <div className="space-y-5 overflow-y-auto border-r border-border p-6">
          <div>
            <SectionTitle>Loan Details</SectionTitle>
            <div className="space-y-4">
              <Field
                label="Primary Borrower"
                value={form.borrower ?? ""}
                onChange={set("borrower")}
                readOnly={!canEditLoanDetails}
              />
              <div>
                <Field
                  label="Arive Loan URL"
                  value={form.url ?? ""}
                  onChange={set("url")}
                  readOnly={!canEditLoanDetails}
                />
                <div className="mt-1 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(form.url ?? "");
                      pushToast("Loan URL copied");
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-rose-700"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                  <button
                    onClick={() => pushToast("Opening Arive in a new tab")}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-rose-700"
                  >
                    <Link2 className="h-3 w-3" /> Open
                  </button>
                </div>
              </div>
              <Field
                label="Subject Property"
                value={form.property ?? ""}
                onChange={set("property")}
                readOnly={!canEditLoanDetails}
              />
              <Field
                label="State"
                value={form.state ?? ""}
                onChange={set("state")}
                readOnly={!canEditLoanDetails}
              />
            </div>
          </div>
          <div>
            <SectionTitle>Amounts & Dates</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Base Loan Amount"
                prefix="$"
                value={Number(form.base || 0).toLocaleString()}
                onChange={(v) => set("base")(v.replace(/[^0-9.]/g, ""))}
                readOnly={!canEditLoanDetails}
              />
              <Field
                label="Total Loan Amount"
                prefix="$"
                value={Number(form.total || 0).toLocaleString()}
                onChange={(v) => set("total")(v.replace(/[^0-9.]/g, ""))}
                readOnly={!canEditLoanDetails}
              />
              <Field
                label="Loan Exp Date"
                value={form.exp ?? ""}
                onChange={set("exp")}
                readOnly={!canEditLoanDetails}
              />
              <Field
                label="Lock Pricing %"
                hint
                value={form.lock ?? ""}
                onChange={set("lock")}
                readOnly={!canEditLoanDetails}
              />
            </div>
          </div>

          {/* Live summary card */}
          <motion.div
            layout
            className="rounded-2xl bg-gradient-to-br from-[#3d0a1c] to-[#1c050d] p-5 text-white ring-1 ring-white/10"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-200/60">
              Live Commission Summary
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-rose-100/70">Total revenue</span>
                <span className="font-bold tabular-nums text-emerald-300">
                  {fmtMoney(totals.revenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-100/70">Total deductions</span>
                <span className="font-bold tabular-nums text-amber-300">
                  − {fmtMoney(totals.deductions)}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t border-white/10 pt-2.5">
                <span className="font-semibold">Net commission</span>
                <motion.span
                  key={totals.net}
                  initial={{ scale: 1.08 }}
                  animate={{ scale: 1 }}
                  className="font-display text-lg font-extrabold tabular-nums"
                >
                  {fmtMoney(totals.net)}
                </motion.span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: commission calculations */}
        <div className="space-y-6 overflow-y-auto p-6">
          <div>
            <SectionTitle>
              Commission Calculations — Revenue Earned
            </SectionTitle>
            <div className="space-y-4">
              <Field
                label="Origination Charge Sec A (1)"
                prefix="$"
                value={Number(form.a1 || 0).toLocaleString()}
                onChange={(v) => set("a1")(v.replace(/[^0-9.]/g, ""))}
                readOnly={!canEditAccounting}
              />
              <Field
                label="Origination Charge Sec A (2)"
                prefix="$"
                value={Number(form.a2 || 0).toLocaleString()}
                onChange={(v) => set("a2")(v.replace(/[^0-9.]/g, ""))}
                readOnly={!canEditAccounting}
              />
              <Field
                label="Origination Charge Sec A (3)"
                prefix="$"
                value={Number(form.a3 || 0).toLocaleString()}
                onChange={(v) => set("a3")(v.replace(/[^0-9.]/g, ""))}
                readOnly={!canEditAccounting}
              />
              <Field
                label="Points Section A Line 01"
                prefix="$"
                value={Number(form.points || 0).toLocaleString()}
                onChange={(v) => set("points")(v.replace(/[^0-9.]/g, ""))}
                readOnly={!canEditAccounting}
              />
              <Field
                label="Yield Spread Premium"
                hint
                prefix="$"
                value={Number(form.ysp || 0).toLocaleString()}
                onChange={(v) => set("ysp")(v.replace(/[^0-9.]/g, ""))}
                readOnly={!canEditAccounting}
              />
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                  Total Revenue
                </span>
                <span className="font-display text-lg font-extrabold tabular-nums text-emerald-700">
                  {fmtMoney(totals.revenue)}
                </span>
              </div>
            </div>
          </div>
          <div>
            <SectionTitle tone="amber">
              Deductions From Revenue Earned
            </SectionTitle>
            <div className="space-y-4">
              <Field
                label="Lock Cost for Rate"
                hint
                prefix="$"
                value={Number(form.lockCost || 0).toLocaleString()}
                onChange={(v) => set("lockCost")(v.replace(/[^0-9.]/g, ""))}
                readOnly={!canEditAccounting}
              />
              <Field
                label="Lender Credit to Borrower"
                prefix="$"
                value={Number(form.lenderCredit || 0).toLocaleString()}
                onChange={(v) => set("lenderCredit")(v.replace(/[^0-9.]/g, ""))}
                readOnly={!canEditAccounting}
              />
              <Field
                label="Patriot Pacific Flat Fee"
                prefix="$"
                value={Number(form.flatFee || 0).toLocaleString()}
                onChange={(v) => set("flatFee")(v.replace(/[^0-9.]/g, ""))}
                readOnly={!canEditAccounting}
              />
              <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-700">
                  Total Deductions
                </span>
                <span className="font-display text-lg font-extrabold tabular-nums text-amber-700">
                  − {fmtMoney(totals.deductions)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border bg-stone-50/60 px-6 py-4">
        <button
          onClick={closePanel}
          className="rounded-full px-5 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          Cancel
        </button>
        {canSave ? (
          <button
            type="button"
            onClick={() => {
              void saveLoanChanges();
            }}
            disabled={saving}
            className="rounded-full bg-gradient-to-r from-rose-700 to-rose-600 px-6 py-2 text-sm font-bold text-white shadow-md shadow-rose-700/25 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save changes"}
          </button>
        ) : (
          <span className="rounded-full bg-stone-200 px-5 py-2 text-sm font-semibold text-muted-foreground">
            View only
          </span>
        )}
      </div>
    </Drawer>
  );
}