import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router";

type LoanOfficer = {
  id: string;
  name: string;
  email?: string;
};

type LoanOfficerField = "primaryLO" | "lo2" | "lo3";

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

const moneyFields = new Set([
  "baseLoanAmount",
  "totalLoanAmount",
  "lockPricing",
  "originationA1",
  "originationA2",
  "originationA3",
  "pointsA01",
  "ysp",
  "lockCost",
  "lenderCredit",
  "flatFee",
]);

const statuses = [
  "Loan Setup",
  "Disclosed",
  "Submitted to Underwriting",
  "Docs Out",
  "Clear to Close",
  "Docs Signed",
  "Loan Funded",
];

export default function AddLoan() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: "",
    borrower: "",
    status: "Loan Setup",
    fundedDate: "",
    calcCompleted: "",
    payrollProcessed: "",
    primaryLO: "",
    lo2: "",
    lo3: "",
    state: "",
    property: "",
    baseLoanAmount: "",
    totalLoanAmount: "",
    loanExpDate: "",
    lockPricing: "",
    type: "RETAIL",
    originationA1: "",
    originationA2: "",
    originationA3: "",
    pointsA01: "",
    ysp: "",
    lockCost: "",
    lenderCredit: "",
    flatFee: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [loanOfficers, setLoanOfficers] = useState<LoanOfficer[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [officerDialog, setOfficerDialog] =
    useState<LoanOfficerField | null>(null);
  const [officerSearch, setOfficerSearch] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [savedLoanId, setSavedLoanId] = useState("");
  const [savedBorrower, setSavedBorrower] = useState("");

  function updateField(
    name: keyof typeof form,
    value: string,
  ) {
    let nextValue = value;

    if (moneyFields.has(name)) {
      nextValue = value
        .replace(/[^0-9.]/g, "")
        .replace(/(\..*)\./g, "$1");

      if (Number(nextValue) < 0) {
        nextValue = "";
      }
    }

    setForm((current) => ({
      ...current,
      [name]: nextValue,
    }));
  }

  useEffect(() => {
    async function loadLoanOfficers() {
      try {
        setLoadingOfficers(true);

        const response = await fetch(`${API_URL}/users`);

        if (!response.ok) {
          throw new Error("Unable to load loan officers.");
        }

        const result = await response.json();

        const records = Array.isArray(result)
          ? result
          : result.users || result.data || [];

        const officers: LoanOfficer[] = records
          .filter((user: any) => {
            const role = String(user.role || "").toLowerCase();

            return (
              role.includes("loan officer") ||
              role === "lo" ||
              role === "loan_officer"
            );
          })
          .map((user: any) => ({
            id: String(user.id),
            name:
              user.name ||
              user.fullName ||
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.email,
            email: user.email,
          }));

        setLoanOfficers(officers);
      } catch (loadError) {
        console.error(loadError);
      } finally {
        setLoadingOfficers(false);
      }
    }

    void loadLoanOfficers();
  }, []);

  const selectedOfficerNames = useMemo(
    () =>
      [form.primaryLO, form.lo2, form.lo3].filter(Boolean),
    [form.primaryLO, form.lo2, form.lo3],
  );

  const availableLoanOfficers = useMemo(() => {
    const query = officerSearch.trim().toLowerCase();

    return loanOfficers.filter((officer) => {
      const currentValue = officerDialog
        ? form[officerDialog]
        : "";

      const selectedElsewhere =
        selectedOfficerNames.includes(officer.name) &&
        currentValue !== officer.name;

      const matchesSearch =
        !query ||
        officer.name.toLowerCase().includes(query) ||
        officer.email?.toLowerCase().includes(query);

      return !selectedElsewhere && matchesSearch;
    });
  }, [
    loanOfficers,
    officerDialog,
    officerSearch,
    selectedOfficerNames,
    form,
  ]);

  function openOfficerDialog(field: LoanOfficerField) {
    setOfficerSearch("");
    setOfficerDialog(field);
  }

  function selectLoanOfficer(officer: LoanOfficer) {
    if (!officerDialog) return;

    updateField(officerDialog, officer.name);
    setOfficerDialog(null);
    setOfficerSearch("");
  }

  function clearLoanOfficer(field: LoanOfficerField) {
    updateField(field, "");
  }

  async function loanIdAlreadyExists(id: string) {
    const response = await fetch(`${API_URL}/loans`);

    if (!response.ok) {
      throw new Error("Unable to validate the Loan ID.");
    }

    const result = await response.json();

    const loans = Array.isArray(result)
      ? result
      : result.loans || result.data || [];

    return loans.some(
      (loan: any) =>
        String(loan.id).trim().toLowerCase() ===
        id.trim().toLowerCase(),
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const cleanLoanId = form.id.trim();

      if (!cleanLoanId) {
        throw new Error("Loan ID is required.");
      }

      if (await loanIdAlreadyExists(cleanLoanId)) {
        throw new Error(
          `Loan ID "${cleanLoanId}" already exists. Please use a unique Loan ID.`,
        );
      }

      const selectedOfficers = [
        form.primaryLO,
        form.lo2,
        form.lo3,
      ].filter(Boolean);

      if (new Set(selectedOfficers).size !== selectedOfficers.length) {
        throw new Error(
          "Primary LO, LO 2, and LO 3 must be different loan officers.",
        );
      }

      const response = await fetch(
        `${API_URL}/loans`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: cleanLoanId,
            borrower: form.borrower,
            status: form.status,
            fundedDate: form.fundedDate || null,
            calcCompleted:
              form.calcCompleted || null,
            payrollProcessed:
              form.payrollProcessed || null,
            primaryLO: form.primaryLO,
            lo2: form.lo2 || null,
            lo3: form.lo3 || null,
            state: form.state,
            hasNotes: false,
            filesCount: 0,
            property: form.property,
            baseLoanAmount:
              Number(form.baseLoanAmount) || 0,
            totalLoanAmount:
              Number(form.totalLoanAmount) || 0,
            loanExpDate: form.loanExpDate || null,
            lockPricing:
              Number(form.lockPricing) || 0,
            type: form.type,

            revenue: {
              originationA1:
                Number(form.originationA1) || 0,
              originationA2:
                Number(form.originationA2) || 0,
              originationA3:
                Number(form.originationA3) || 0,
              pointsA01:
                Number(form.pointsA01) || 0,
              ysp: Number(form.ysp) || 0,
            },

            deductions: {
              lockCost:
                Number(form.lockCost) || 0,
              lenderCredit:
                Number(form.lenderCredit) || 0,
              flatFee:
                Number(form.flatFee) || 0,
            },
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to add loan.",
        );
      }

      setSavedLoanId(cleanLoanId);
      setSavedBorrower(form.borrower);
      setSuccessOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add loan.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">
          Add New Loan
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Enter the loan information below.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <FormSection title="Basic Information">
          <Input
            label="Loan ID"
            value={form.id}
            required
            onChange={(value) =>
              updateField("id", value)
            }
          />

          <Input
            label="Borrower"
            value={form.borrower}
            required
            onChange={(value) =>
              updateField("borrower", value)
            }
          />

          <SelectInput
            label="Status"
            value={form.status}
            options={statuses}
            onChange={(value) =>
              updateField("status", value)
            }
          />

          <Input
            label="State"
            value={form.state}
            required
            maxLength={2}
            onChange={(value) =>
              updateField(
                "state",
                value.toUpperCase(),
              )
            }
          />

          <Input
            label="Loan Type"
            value={form.type}
            required
            onChange={(value) =>
              updateField("type", value)
            }
          />

          <Input
            label="Property Address"
            value={form.property}
            required
            onChange={(value) =>
              updateField("property", value)
            }
          />
        </FormSection>

        <FormSection title="Loan Officers">
          <LoanOfficerPicker
            label="Primary LO"
            value={form.primaryLO}
            required
            loading={loadingOfficers}
            onOpen={() => openOfficerDialog("primaryLO")}
            onClear={() => clearLoanOfficer("primaryLO")}
          />

          <LoanOfficerPicker
            label="LO 2"
            value={form.lo2}
            loading={loadingOfficers}
            onOpen={() => openOfficerDialog("lo2")}
            onClear={() => clearLoanOfficer("lo2")}
          />

          <LoanOfficerPicker
            label="LO 3"
            value={form.lo3}
            loading={loadingOfficers}
            onOpen={() => openOfficerDialog("lo3")}
            onClear={() => clearLoanOfficer("lo3")}
          />
        </FormSection>

        <FormSection title="Dates">
          <Input
            label="Funded Date"
            type="date"
            value={form.fundedDate}
            onChange={(value) =>
              updateField("fundedDate", value)
            }
          />

          <Input
            label="Calculation Completed"
            type="date"
            value={form.calcCompleted}
            onChange={(value) =>
              updateField(
                "calcCompleted",
                value,
              )
            }
          />

          <Input
            label="Payroll Processed"
            type="date"
            value={form.payrollProcessed}
            onChange={(value) =>
              updateField(
                "payrollProcessed",
                value,
              )
            }
          />

          <Input
            label="Loan Expiration Date"
            type="date"
            value={form.loanExpDate}
            onChange={(value) =>
              updateField("loanExpDate", value)
            }
          />
        </FormSection>

        <FormSection title="Loan Amounts">
          <Input
            label="Base Loan Amount"
            type="number"
            value={form.baseLoanAmount}
            onChange={(value) =>
              updateField(
                "baseLoanAmount",
                value,
              )
            }
          />

          <Input
            label="Total Loan Amount"
            type="number"
            value={form.totalLoanAmount}
            onChange={(value) =>
              updateField(
                "totalLoanAmount",
                value,
              )
            }
          />

          <Input
            label="Lock Pricing"
            type="number"
            step="0.001"
            value={form.lockPricing}
            onChange={(value) =>
              updateField("lockPricing", value)
            }
          />
        </FormSection>

        <FormSection title="Revenue">
          <Input
            label="Origination A1"
            type="number"
            value={form.originationA1}
            onChange={(value) =>
              updateField(
                "originationA1",
                value,
              )
            }
          />

          <Input
            label="Origination A2"
            type="number"
            value={form.originationA2}
            onChange={(value) =>
              updateField(
                "originationA2",
                value,
              )
            }
          />

          <Input
            label="Origination A3"
            type="number"
            value={form.originationA3}
            onChange={(value) =>
              updateField(
                "originationA3",
                value,
              )
            }
          />

          <Input
            label="Points A01"
            type="number"
            value={form.pointsA01}
            onChange={(value) =>
              updateField("pointsA01", value)
            }
          />

          <Input
            label="YSP"
            type="number"
            value={form.ysp}
            onChange={(value) =>
              updateField("ysp", value)
            }
          />
        </FormSection>

        <FormSection title="Deductions">
          <Input
            label="Lock Cost"
            type="number"
            value={form.lockCost}
            onChange={(value) =>
              updateField("lockCost", value)
            }
          />

          <Input
            label="Lender Credit"
            type="number"
            value={form.lenderCredit}
            onChange={(value) =>
              updateField(
                "lenderCredit",
                value,
              )
            }
          />

          <Input
            label="Flat Fee"
            type="number"
            value={form.flatFee}
            onChange={(value) =>
              updateField("flatFee", value)
            }
          />
        </FormSection>

        <div className="flex justify-end gap-3 border-t border-border pt-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Loan"}
          </button>
        </div>
      </form>

      <LoadingDialog
        open={saving}
        title="Saving Loan"
        message="Please wait while the loan information is being saved."
      />

      <SuccessDialog
        open={successOpen}
        loanId={savedLoanId}
        borrower={savedBorrower}
        onViewLoan={() => {
          setSuccessOpen(false);

          navigate(
            form.status === "Loan Funded"
              ? "/funded"
              : "/active",
          );
        }}
        onAddAnother={() => {
          setSuccessOpen(false);
          window.location.reload();
        }}
      />

      <LoanOfficerDialog
        open={officerDialog !== null}
        title={
          officerDialog === "primaryLO"
            ? "Select Primary Loan Officer"
            : officerDialog === "lo2"
              ? "Select Loan Officer 2"
              : "Select Loan Officer 3"
        }
        search={officerSearch}
        loading={loadingOfficers}
        officers={availableLoanOfficers}
        onSearch={setOfficerSearch}
        onSelect={selectLoanOfficer}
        onClose={() => setOfficerDialog(null)}
      />
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  maxLength,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  step?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-semibold">
        {label}
        {required && (
          <span className="text-red-600"> *</span>
        )}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        maxLength={maxLength}
        step={step}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-semibold">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function LoanOfficerPicker({
  label,
  value,
  required = false,
  loading,
  onOpen,
  onClear,
}: {
  label: string;
  value: string;
  required?: boolean;
  loading: boolean;
  onOpen: () => void;
  onClear: () => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-semibold">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>

      <div className="flex h-11 overflow-hidden rounded-xl border border-input bg-white transition focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-500/10">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center px-3 text-left text-sm"
        >
          <span
            className={
              value
                ? "truncate text-foreground"
                : "truncate text-muted-foreground"
            }
          >
            {loading
              ? "Loading loan officers..."
              : value || "Choose loan officer"}
          </span>
        </button>

        {value && (
          <button
            type="button"
            onClick={onClear}
            className="border-l border-border px-3 text-lg text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
            aria-label={`Clear ${label}`}
          >
            ×
          </button>
        )}
      </div>

      {required && (
        <input
          value={value}
          required
          onChange={() => undefined}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          tabIndex={-1}
        />
      )}
    </label>
  );
}

function LoanOfficerDialog({
  open,
  title,
  search,
  loading,
  officers,
  onSearch,
  onSelect,
  onClose,
}: {
  open: boolean;
  title: string;
  search: string;
  loading: boolean;
  officers: LoanOfficer[];
  onSearch: (value: string) => void;
  onSelect: (officer: LoanOfficer) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]"
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/50 bg-white shadow-2xl animate-[dialogIn_220ms_cubic-bezier(0.16,1,0.3,1)]">
        <div className="border-b border-border bg-gradient-to-r from-rose-950 to-rose-800 px-6 py-5 text-white">
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm text-white/70">
            Officers already assigned to another LO field are unavailable.
          </p>
        </div>

        <div className="p-5">
          <input
            autoFocus
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search by name or email..."
            className="h-11 w-full rounded-xl border border-input px-4 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
          />

          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-rose-200 border-t-rose-700" />
                Loading loan officers...
              </div>
            ) : officers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                No available loan officer found.
              </div>
            ) : (
              officers.map((officer) => (
                <button
                  key={officer.id}
                  type="button"
                  onClick={() => onSelect(officer)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-border p-3 text-left transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 font-bold text-rose-800">
                    {officer.name
                      .split(" ")
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {officer.name}
                    </p>
                    {officer.email && (
                      <p className="truncate text-xs text-muted-foreground">
                        {officer.email}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-border bg-muted/30 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingDialog({
  open,
  title,
  message,
}: {
  open: boolean;
  title: string;
  message: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-white p-8 text-center shadow-2xl animate-[dialogIn_220ms_cubic-bezier(0.16,1,0.3,1)]">
        <div className="relative mx-auto h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-rose-100" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-rose-700 border-r-rose-400" />
          <div className="absolute inset-[10px] animate-pulse rounded-full bg-rose-100" />
        </div>

        <h2 className="mt-5 text-lg font-bold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {message}
        </p>

        <div className="mt-5 flex justify-center gap-1">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-2 w-2 animate-bounce rounded-full bg-rose-700"
              style={{ animationDelay: `${index * 120}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SuccessDialog({
  open,
  loanId,
  borrower,
  onViewLoan,
  onAddAnother,
}: {
  open: boolean;
  loanId: string;
  borrower: string;
  onViewLoan: () => void;
  onAddAnother: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white text-center shadow-2xl animate-[dialogIn_260ms_cubic-bezier(0.16,1,0.3,1)]">
        <div className="bg-gradient-to-br from-emerald-50 to-white px-7 pb-6 pt-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
            <svg
              viewBox="0 0 24 24"
              className="h-10 w-10 text-emerald-600 animate-[checkIn_350ms_ease-out]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
              />
            </svg>
          </div>

          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            Loan Successfully Added
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            The loan information was saved successfully.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-white p-4 text-left shadow-sm">
            <div className="flex justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Loan ID
              </span>
              <span className="text-sm font-bold">{loanId}</span>
            </div>

            <div className="mt-3 flex justify-between gap-4 border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">
                Borrower
              </span>
              <span className="truncate text-sm font-bold">
                {borrower}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-border bg-muted/30 p-5">
          <button
            type="button"
            onClick={onAddAnother}
            className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold transition hover:bg-muted"
          >
            Add Another
          </button>

          <button
            type="button"
            onClick={onViewLoan}
            className="flex-1 rounded-xl bg-rose-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-700/20 transition hover:-translate-y-0.5 hover:bg-rose-800"
          >
            View Loan
          </button>
        </div>
      </div>
    </div>
  );
}