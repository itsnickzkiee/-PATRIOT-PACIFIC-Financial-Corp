import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router";
import type { Loan } from "@/data/mock";
import { useAuth } from "@/state/AuthContext";

const statuses = [
  "Loan Setup",
  "Disclosed",
  "Submitted to Underwriting",
  "Docs Out",
  "Clear to Close",
  "Docs Signed",
  "Loan Funded",
];

interface LoanForm {
  borrower: string;
  status: string;
  fundedDate: string;
  calcCompleted: string;
  payrollProcessed: string;
  primaryLO: string;
  lo2: string;
  lo3: string;
  state: string;
  property: string;
  baseLoanAmount: string;
  totalLoanAmount: string;
  loanExpDate: string;
  lockPricing: string;
  type: string;
  originationA1: string;
  originationA2: string;
  originationA3: string;
  pointsA01: string;
  ysp: string;
  lockCost: string;
  lenderCredit: string;
  flatFee: string;
}

const initialForm: LoanForm = {
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
};

export default function EditLoan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const normalizedRole =
    user?.role
      ?.trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_") ?? "";

  const canEdit =
    normalizedRole === "admin" ||
    normalizedRole === "super_admin" ||
    normalizedRole === "superadmin" ||
    normalizedRole === "system_administrator" ||
    normalizedRole === "processor" ||
    normalizedRole === "accounting";

  const isLoanOfficer =
    normalizedRole === "loan_officer" ||
    normalizedRole === "loanofficer";

  const [form, setForm] =
    useState<LoanForm>(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    if (isLoanOfficer || !canEdit) {
      navigate("/active", {
        replace: true,
      });
    }
  }, [
    user,
    isLoanOfficer,
    canEdit,
    navigate,
  ]);

  useEffect(() => {
    async function loadLoan() {
      if (!user || !canEdit) {
        setLoading(false);
        return;
      }

      if (!id) {
        setError("Loan ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/loans/${id}`,
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to load loan.",
          );
        }

        const loan = result as Loan;

        setForm({
          borrower: loan.borrower,
          status: loan.status,
          fundedDate: loan.fundedDate ?? "",
          calcCompleted:
            loan.calcCompleted ?? "",
          payrollProcessed:
            loan.payrollProcessed ?? "",
          primaryLO: loan.primaryLO,
          lo2: loan.lo2 ?? "",
          lo3: loan.lo3 ?? "",
          state: loan.state,
          property: loan.property,
          baseLoanAmount: String(
            loan.baseLoanAmount,
          ),
          totalLoanAmount: String(
            loan.totalLoanAmount,
          ),
          loanExpDate:
            loan.loanExpDate ?? "",
          lockPricing: String(
            loan.lockPricing,
          ),
          type: loan.type,
          originationA1: String(
            loan.revenue.originationA1,
          ),
          originationA2: String(
            loan.revenue.originationA2,
          ),
          originationA3: String(
            loan.revenue.originationA3,
          ),
          pointsA01: String(
            loan.revenue.pointsA01,
          ),
          ysp: String(loan.revenue.ysp),
          lockCost: String(
            loan.deductions.lockCost,
          ),
          lenderCredit: String(
            loan.deductions.lenderCredit,
          ),
          flatFee: String(
            loan.deductions.flatFee,
          ),
        });
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load loan.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadLoan();
  }, [id, user, canEdit]);

  function updateField(
    field: keyof LoanForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!user || !canEdit) {
      setError(
        "You do not have permission to edit this loan.",
      );
      return;
    }

    if (!id) {
      setError("Loan ID is missing.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/loans/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            "x-user-id": String(user.id),
          },
          body: JSON.stringify({
            borrower: form.borrower,
            status: form.status,

            fundedDate:
              form.fundedDate || null,

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
              Number(form.baseLoanAmount) ||
              0,

            totalLoanAmount:
              Number(
                form.totalLoanAmount,
              ) || 0,

            loanExpDate:
              form.loanExpDate || null,

            lockPricing:
              Number(form.lockPricing) ||
              0,

            type: form.type,

            revenue: {
              originationA1:
                Number(
                  form.originationA1,
                ) || 0,

              originationA2:
                Number(
                  form.originationA2,
                ) || 0,

              originationA3:
                Number(
                  form.originationA3,
                ) || 0,

              pointsA01:
                Number(form.pointsA01) ||
                0,

              ysp:
                Number(form.ysp) || 0,
            },

            deductions: {
              lockCost:
                Number(form.lockCost) ||
                0,

              lenderCredit:
                Number(
                  form.lenderCredit,
                ) || 0,

              flatFee:
                Number(form.flatFee) ||
                0,
            },
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to update loan.",
        );
      }

      if (
        form.status === "Loan Funded" &&
        form.calcCompleted &&
        form.payrollProcessed
      ) {
        navigate("/archived");
      } else if (
        form.status === "Loan Funded"
      ) {
        navigate("/funded");
      } else {
        navigate("/active");
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update loan.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!user || !canEdit) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        Checking access permission...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        Loading loan information...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">
          Edit Loan
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Loan ID: {id}
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
            label="Borrower"
            value={form.borrower}
            required
            onChange={(value) =>
              updateField(
                "borrower",
                value,
              )
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
              updateField(
                "property",
                value,
              )
            }
          />
        </FormSection>

        <FormSection title="Loan Officers">
          <Input
            label="Primary LO"
            value={form.primaryLO}
            required
            onChange={(value) =>
              updateField(
                "primaryLO",
                value,
              )
            }
          />

          <Input
            label="LO 2"
            value={form.lo2}
            onChange={(value) =>
              updateField("lo2", value)
            }
          />

          <Input
            label="LO 3"
            value={form.lo3}
            onChange={(value) =>
              updateField("lo3", value)
            }
          />
        </FormSection>

        <FormSection title="Dates">
          <Input
            label="Funded Date"
            type="date"
            value={form.fundedDate}
            onChange={(value) =>
              updateField(
                "fundedDate",
                value,
              )
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
            value={
              form.payrollProcessed
            }
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
              updateField(
                "loanExpDate",
                value,
              )
            }
          />
        </FormSection>

        <FormSection title="Loan Amounts">
          <Input
            label="Base Loan Amount"
            type="number"
            value={
              form.baseLoanAmount
            }
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
            value={
              form.totalLoanAmount
            }
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
              updateField(
                "lockPricing",
                value,
              )
            }
          />
        </FormSection>

        <FormSection title="Revenue">
          <Input
            label="Origination A1"
            type="number"
            value={
              form.originationA1
            }
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
            value={
              form.originationA2
            }
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
            value={
              form.originationA3
            }
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
              updateField(
                "pointsA01",
                value,
              )
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
              updateField(
                "lockCost",
                value,
              )
            }
          />

          <Input
            label="Lender Credit"
            type="number"
            value={
              form.lenderCredit
            }
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
              updateField(
                "flatFee",
                value,
              )
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
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </form>
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
          <span className="text-red-600">
            {" "}
            *
          </span>
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
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}