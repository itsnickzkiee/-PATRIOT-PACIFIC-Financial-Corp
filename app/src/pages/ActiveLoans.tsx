import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ListTodo,
  StickyNote,
  Folder,
  UserRoundCheck,
  X,
} from "lucide-react";

type Loan = {
  id: string;
  borrower: string;
  status: string;
  fundedDate: string;
  calcCompleted: string | null;
  payrollProcessed: string | null;
  primaryLO: string;
  lo2: string | null;
  lo3: string | null;
  state: string;
  hasNotes: boolean;
  filesCount: number;
  property: string;
  baseLoanAmount: number;
  totalLoanAmount: number;
  loanExpDate: string;
  lockPricing: number;
  type: string;
  revenue: {
    originationA1: number;
    originationA2: number;
    originationA3: number;
    pointsA01: number;
    ysp: number;
  };
  deductions: {
    lockCost: number;
    lenderCredit: number;
    flatFee: number;
  };
};

function netCommission(loan: Loan): number {
  const revenue =
    Number(loan.revenue.originationA1 || 0) +
    Number(loan.revenue.originationA2 || 0) +
    Number(loan.revenue.originationA3 || 0) +
    Number(loan.revenue.pointsA01 || 0) +
    Number(loan.revenue.ysp || 0);

  const deductions =
    Number(loan.deductions.lockCost || 0) +
    Number(loan.deductions.lenderCredit || 0) +
    Number(loan.deductions.flatFee || 0);

  return revenue - deductions;
}

function fmtMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
import { useAuth } from "@/state/AuthContext";
import { useWorkspace } from "@/state/workspace";

import "./ActiveLoans.css";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const activeStatuses = [
  "Loan Setup",
  "Disclosed",
  "Submitted to Underwriting",
  "Approved w/ Conditions",
  "Re-submittal",
  "Clear to Close",
  "Docs Out",
  "Docs Signed",
];

type LoanOfficerOption = {
  id: number;
  name: string;
  email: string;
};

type LoanOfficerSlot =
  | "primaryLO"
  | "lo2"
  | "lo3";

function formatDate(
  date?: string | null,
) {
  if (!date) {
    return "No date set";
  }

  const parsedDate = new Date(
    `${date}T00:00:00`,
  );

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "en-CA",
  );
}

function getMonthFromDate(
  date?: string | null,
) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(
    `${date}T00:00:00`,
  );

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return "";
  }

  return months[
    parsedDate.getMonth()
  ];
}

function getStatusClass(
  status: string,
) {
  return status
    .toLowerCase()
    .replaceAll(" ", "-");
}

export default function ActiveLoans() {
  const { user } = useAuth();
  const { openPanel } = useWorkspace();

  const normalizedRole =
    user?.role
      ?.trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_") ?? "";

  const isAdmin =
    normalizedRole === "admin" ||
    normalizedRole === "super_admin" ||
    normalizedRole === "superadmin" ||
    normalizedRole === "system_administrator";

  const [loanOfficers, setLoanOfficers] =
    useState<LoanOfficerOption[]>([]);

  const [assignmentLoan, setAssignmentLoan] =
    useState<Loan | null>(null);

  const [assignmentSlot, setAssignmentSlot] =
    useState<LoanOfficerSlot>("lo3");

  const [
    selectedLoanOfficerId,
    setSelectedLoanOfficerId,
  ] = useState("");

  const [
    loadingLoanOfficers,
    setLoadingLoanOfficers,
  ] = useState(false);

  const [assigningOfficer, setAssigningOfficer] =
    useState(false);

  const [removingOfficer, setRemovingOfficer] =
    useState(false);

  const [
    assignmentError,
    setAssignmentError,
  ] = useState("");

  const [
    loanOfficerSearch,
    setLoanOfficerSearch,
  ] = useState("");

  const [loans, setLoans] =
    useState<Loan[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("All Types");

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState("All");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const rowsPerPage = 25;

  useEffect(() => {
    async function loadLoans() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "http://localhost:5000/api/loans",
            {
              headers: {
                "x-user-id": String(user?.id ?? ""),
              },
            },
          );

        if (!response.ok) {
          throw new Error(
            "Failed to load active loans.",
          );
        }

        const data: Loan[] =
          await response.json();

        setLoans(data);
      } catch (err) {
        console.error(
          "Failed to fetch active loans:",
          err,
        );

        setError(
          "Unable to load active loans. Make sure the backend is running.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadLoans();
  }, [user?.id]);

  const filteredLoans =
    useMemo(() => {
      const normalizedSearch =
        searchText
          .trim()
          .toLowerCase();

      return loans.filter(
        (loan) => {
          const isActive =
            activeStatuses.includes(
              loan.status,
            );

          const matchesSearch =
            normalizedSearch ===
              "" ||
            loan.borrower
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            loan.id
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            loan.primaryLO
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            loan.state
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            selectedStatus ===
              "All Types" ||
            loan.status ===
              selectedStatus;

          const loanMonth =
            getMonthFromDate(
              loan.fundedDate ||
                loan.calcCompleted ||
                loan.payrollProcessed ||
                loan.loanExpDate,
            );

          const matchesMonth =
            selectedMonth ===
              "All" ||
            loanMonth ===
              selectedMonth;

          return (
            isActive &&
            matchesSearch &&
            matchesStatus &&
            matchesMonth
          );
        },
      );
    }, [
      loans,
      searchText,
      selectedStatus,
      selectedMonth,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredLoans.length /
        rowsPerPage,
    ),
  );

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages,
    );

  const displayedLoans =
    filteredLoans.slice(
      (safeCurrentPage - 1) *
        rowsPerPage,
      safeCurrentPage *
        rowsPerPage,
    );

  function resetFilters() {
    setSearchText("");
    setSelectedStatus(
      "All Types",
    );
    setSelectedMonth("All");
    setCurrentPage(1);
  }

  async function openLoanOfficerPicker(
    loan: Loan,
    slot: LoanOfficerSlot,
  ) {
    if (!user || !isAdmin) {
      return;
    }

    setAssignmentLoan(loan);
    setAssignmentSlot(slot);
    setSelectedLoanOfficerId("");
    setLoanOfficerSearch("");
    setAssignmentError("");
    setLoadingLoanOfficers(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/users/loan-officers",
        {
          headers: {
            "x-user-id": String(user.id),
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to load Loan Officers.",
        );
      }

      const officers =
        result.loanOfficers as LoanOfficerOption[];

      setLoanOfficers(officers);

      const assignedName =
        slot === "primaryLO"
          ? loan.primaryLO
          : slot === "lo2"
            ? loan.lo2
            : loan.lo3;

      const assignedOfficer =
        officers.find(
          (officer) =>
            officer.name
              .trim()
              .toLowerCase() ===
            assignedName
              ?.trim()
              .toLowerCase(),
        );

      setSelectedLoanOfficerId(
        assignedOfficer
          ? String(assignedOfficer.id)
          : "",
      );
    } catch (err) {
      setAssignmentError(
        err instanceof Error
          ? err.message
          : "Unable to load Loan Officers.",
      );
    } finally {
      setLoadingLoanOfficers(false);
    }
  }

  function closeLoanOfficerPicker() {
    if (
      assigningOfficer ||
      removingOfficer
    ) {
      return;
    }

    setAssignmentLoan(null);
    setAssignmentSlot("lo3");
    setSelectedLoanOfficerId("");
    setLoanOfficerSearch("");
    setAssignmentError("");
  }

  async function assignLoanOfficer() {
    if (
      !user ||
      !isAdmin ||
      !assignmentLoan ||
      !selectedLoanOfficerId
    ) {
      setAssignmentError(
        "Please select a Loan Officer.",
      );
      return;
    }

    try {
      setAssigningOfficer(true);
      setAssignmentError("");

      const response = await fetch(
        `http://localhost:5000/api/loans/${assignmentLoan.id}/loan-officer`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            "x-user-id": String(user.id),
          },
          body: JSON.stringify({
            slot:
              assignmentSlot === "primaryLO"
                ? "primary_lo"
                : assignmentSlot,
            userId: Number(
              selectedLoanOfficerId,
            ),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to assign the Loan Officer.",
        );
      }

      const updatedLoan =
        result.loan as Loan;

      setLoans((currentLoans) =>
        currentLoans.map((loan) =>
          loan.id === updatedLoan.id
            ? updatedLoan
            : loan,
        ),
      );

      closeLoanOfficerPicker();
    } catch (err) {
      setAssignmentError(
        err instanceof Error
          ? err.message
          : "Unable to assign the Loan Officer.",
      );
    } finally {
      setAssigningOfficer(false);
    }
  }

  function getAssignedName(
    loan: Loan,
    slot: LoanOfficerSlot,
  ): string | null {
    if (slot === "primaryLO") {
      return loan.primaryLO || null;
    }

    if (slot === "lo2") {
      return loan.lo2 || null;
    }

    return loan.lo3 || null;
  }

  function getOtherAssignedNames(
    loan: Loan,
    slot: LoanOfficerSlot,
  ): string[] {
    const assignments = [
      {
        slot: "primaryLO" as LoanOfficerSlot,
        name: loan.primaryLO,
      },
      {
        slot: "lo2" as LoanOfficerSlot,
        name: loan.lo2,
      },
      {
        slot: "lo3" as LoanOfficerSlot,
        name: loan.lo3,
      },
    ];

    return assignments
      .filter(
        (assignment) =>
          assignment.slot !== slot &&
          Boolean(assignment.name),
      )
      .map((assignment) =>
        String(assignment.name)
          .trim()
          .toLowerCase(),
      );
  }

  const currentAssignedName =
    assignmentLoan
      ? getAssignedName(
          assignmentLoan,
          assignmentSlot,
        )
      : null;

  const filteredLoanOfficers =
    loanOfficers.filter((officer) => {
      const query =
        loanOfficerSearch
          .trim()
          .toLowerCase();

      const officerName =
        officer.name.trim().toLowerCase();

      const unavailableNames =
        assignmentLoan
          ? getOtherAssignedNames(
              assignmentLoan,
              assignmentSlot,
            )
          : [];

      if (
        unavailableNames.includes(
          officerName,
        )
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        officerName.includes(query) ||
        officer.email
          .toLowerCase()
          .includes(query)
      );
    });

  async function removeLoanOfficer() {
    if (
      !user ||
      !isAdmin ||
      !assignmentLoan ||
      !currentAssignedName
    ) {
      return;
    }

    try {
      setRemovingOfficer(true);
      setAssignmentError("");

      const response = await fetch(
        `http://localhost:5000/api/loans/${assignmentLoan.id}/loan-officer`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            "x-user-id": String(user.id),
          },
          body: JSON.stringify({
            slot:
              assignmentSlot === "primaryLO"
                ? "primary_lo"
                : assignmentSlot,
            userId: null,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to remove the Loan Officer.",
        );
      }

      const updatedLoan =
        result.loan as Loan;

      setLoans((currentLoans) =>
        currentLoans.map((loan) =>
          loan.id === updatedLoan.id
            ? updatedLoan
            : loan,
        ),
      );

      closeLoanOfficerPicker();
    } catch (err) {
      setAssignmentError(
        err instanceof Error
          ? err.message
          : "Unable to remove the Loan Officer.",
      );
    } finally {
      setRemovingOfficer(false);
    }
  }

  function exportCsv() {
    const headers = [
      "Loan ID",
      "Borrower",
      "Status",
      "Funded Date",
      "Calculation Completed",
      "Payroll Processed",
      "Primary LO",
      "LO 2",
      "LO 3",
      "State",
      "Net Commission",
    ];

    const rows =
      filteredLoans.map(
        (loan) => [
          loan.id,
          loan.borrower,
          loan.status,
          loan.fundedDate || "",
          loan.calcCompleted || "",
          loan.payrollProcessed ||
            "",
          loan.primaryLO,
          loan.lo2 || "",
          loan.lo3 || "",
          loan.state,
          fmtMoney(
            netCommission(loan),
          ),
        ],
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(
                value,
              ).replaceAll(
                '"',
                '""',
              )}"`,
          )
          .join(","),
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "active-loans.csv";

    document.body.appendChild(
      link,
    );

    link.click();

    document.body.removeChild(
      link,
    );

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <section className="active-loans-page">
        <div className="loans-table-container">
          <div className="empty-results">
            Loading active
            loans...
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="active-loans-page">
        <div className="loans-table-container">
          <div className="empty-results">
            {error}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="active-loans-page">
      <header className="active-page-header">
        <div>
          <h1>
            Active Loans
          </h1>

          <p>
            Loans currently
            moving through the
            pipeline.
          </p>
        </div>

        <button
          type="button"
          className="export-button"
          onClick={exportCsv}
          disabled={
            filteredLoans.length ===
            0
          }
        >
          <span aria-hidden="true">
            ⇩
          </span>

          Export
        </button>
      </header>

      <div className="loan-filters">
        <div className="search-wrapper">
          <span
            className="search-icon"
            aria-hidden="true"
          >
            ⌕
          </span>

          <input
            type="search"
            value={searchText}
            placeholder="Search borrower, LO, ID..."
            onChange={(event) => {
              setSearchText(
                event.target.value,
              );

              setCurrentPage(1);
            }}
          />
        </div>

        <select
          className="status-select"
          value={selectedStatus}
          onChange={(event) => {
            setSelectedStatus(
              event.target.value,
            );

            setCurrentPage(1);
          }}
        >
          <option value="All Types">
            All Types
          </option>

          {activeStatuses.map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ),
          )}
        </select>

        <div className="month-filter">
          <button
            type="button"
            className={
              selectedMonth ===
              "All"
                ? "selected"
                : ""
            }
            onClick={() => {
              setSelectedMonth(
                "All",
              );

              setCurrentPage(1);
            }}
          >
            All
          </button>

          {months.map(
            (month) => (
              <button
                type="button"
                key={month}
                className={
                  selectedMonth ===
                  month
                    ? "selected"
                    : ""
                }
                onClick={() => {
                  setSelectedMonth(
                    month,
                  );

                  setCurrentPage(
                    1,
                  );
                }}
              >
                {month}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="clear-button"
          onClick={resetFilters}
        >
          Clear
        </button>
      </div>

      <div className="loans-table-container">
        <table className="loans-table">
          <thead>
            <tr>
              <th>
                Loan ID
              </th>

              <th>
                Borrower
              </th>

              <th>
                Status
              </th>

              <th>
                Funded Date
              </th>

              <th>
                Calc.
                Completed
              </th>

              <th>
                Payroll
                Processed
              </th>

              <th>
                Primary LO
              </th>

              <th>
                LO 2
              </th>

              <th>
                LO 3
              </th>

              <th>
                State
              </th>

              <th>
                Net Comm.
              </th>

              <th className="actions-heading">
                Details · Notes ·
                Files
              </th>
            </tr>
          </thead>

          <tbody>
            {displayedLoans.length >
            0 ? (
              displayedLoans.map(
                (loan) => (
                  <tr
                    key={loan.id}
                  >
                    <td className="loan-id">
                      #{loan.id}
                    </td>

                    <td>
                      <strong className="borrower-name">
                        {
                          loan.borrower
                        }
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          loan.status,
                        )}`}
                      >
                        <span className="status-dot" />

                        {
                          loan.status
                        }
                      </span>
                    </td>

                    <td className="date-cell">
                      {formatDate(
                        loan.fundedDate,
                      )}
                    </td>

                    <td>
                      {loan.calcCompleted ? (
                        <div className="completed-date">
                          <span>
                            ✓
                          </span>

                          {formatDate(
                            loan.calcCompleted,
                          )}
                        </div>
                      ) : (
                        <div className="empty-date">
                          <span>
                            ◷
                          </span>

                          No date set
                        </div>
                      )}
                    </td>

                    <td>
                      {loan.payrollProcessed ? (
                        <div className="completed-date">
                          <span>
                            ✓
                          </span>

                          {formatDate(
                            loan.payrollProcessed,
                          )}
                        </div>
                      ) : (
                        <div className="empty-date">
                          <span>
                            ◷
                          </span>

                          No date set
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="loan-officer-cell">
                        {loan.primaryLO ? (
                          <button
                            type="button"
                            className="assigned-lo-name"
                            title="Change Primary LO"
                            onClick={(event) => {
                              event.stopPropagation();

                              void openLoanOfficerPicker(
                                loan,
                                "primaryLO",
                              );
                            }}
                          >
                            {loan.primaryLO}
                          </button>
                        ) : isAdmin ? (
                          <button
                            type="button"
                            className="add-lo-button"
                            title="Assign Primary LO"
                            aria-label={`Assign Primary Loan Officer for ${loan.borrower}`}
                            onClick={(event) => {
                              event.stopPropagation();

                              void openLoanOfficerPicker(
                                loan,
                                "primaryLO",
                              );
                            }}
                          >
                            <UserRoundCheck className="h-4 w-4" />
                          </button>
                        ) : (
                          <em className="unassigned">
                            No LO assigned
                          </em>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="loan-officer-cell">
                        {loan.lo2 ? (
                          <button
                            type="button"
                            className="assigned-lo-name"
                            title="Change LO 2"
                            onClick={(event) => {
                              event.stopPropagation();

                              void openLoanOfficerPicker(
                                loan,
                                "lo2",
                              );
                            }}
                          >
                            {loan.lo2}
                          </button>
                        ) : isAdmin ? (
                          <button
                            type="button"
                            className="add-lo-button"
                            title="Assign LO 2"
                            aria-label={`Assign second Loan Officer for ${loan.borrower}`}
                            onClick={(event) => {
                              event.stopPropagation();

                              void openLoanOfficerPicker(
                                loan,
                                "lo2",
                              );
                            }}
                          >
                            <UserRoundCheck className="h-4 w-4" />
                          </button>
                        ) : (
                          <em className="unassigned">
                            No LO assigned
                          </em>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="loan-officer-cell">
                        {loan.lo3 ? (
                          <button
                            type="button"
                            className="assigned-lo-name"
                            title="Change LO 3"
                            onClick={(event) => {
                              event.stopPropagation();

                              void openLoanOfficerPicker(
                                loan,
                                "lo3",
                              );
                            }}
                          >
                            {loan.lo3}
                          </button>
                        ) : isAdmin ? (
                          <button
                            type="button"
                            className="add-lo-button"
                            title="Assign LO 3"
                            aria-label={`Assign third Loan Officer for ${loan.borrower}`}
                            onClick={(event) => {
                              event.stopPropagation();

                              void openLoanOfficerPicker(
                                loan,
                                "lo3",
                              );
                            }}
                          >
                            <UserRoundCheck className="h-4 w-4" />
                          </button>
                        ) : (
                          <em className="unassigned">
                            No LO assigned
                          </em>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="state-badge">
                        {loan.state}
                      </span>
                    </td>

                    <td className="commission">
                      {fmtMoney(
                        netCommission(
                          loan,
                        ),
                      )}
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="action-icon-button"
                          title="Details"
                          aria-label="View loan details"
                          onClick={(
                            event,
                          ) => {
                            event.stopPropagation();

                            openPanel(
                              loan as Parameters<
                                typeof openPanel
                              >[0],
                              "details",
                            );
                          }}
                        >
                          <ListTodo className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          className={`action-icon-button ${
                            loan.hasNotes
                              ? "has-update"
                              : ""
                          }`}
                          title="Notes"
                          aria-label="View notes"
                          onClick={(
                            event,
                          ) => {
                            event.stopPropagation();

                            openPanel(
                              loan as Parameters<
                                typeof openPanel
                              >[0],
                              "notes",
                            );
                          }}
                        >
                          <StickyNote className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          className={`action-icon-button ${
                            loan.filesCount > 0
                              ? "has-update"
                              : ""
                          }`}
                          title="Files"
                          aria-label={`${loan.filesCount} files`}
                          onClick={(
                            event,
                          ) => {
                            event.stopPropagation();

                            openPanel(
                              loan as Parameters<
                                typeof openPanel
                              >[0],
                              "files",
                            );
                          }}
                        >
                          <Folder className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )
            ) : (
              <tr>
                <td
                  className="empty-results"
                  colSpan={12}
                >
                  No active loans
                  match your
                  filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="table-footer">
        <span>
          Showing{" "}
          {filteredLoans.length ===
          0
            ? 0
            : (safeCurrentPage -
                1) *
                rowsPerPage +
              1}
          –
          {Math.min(
            safeCurrentPage *
              rowsPerPage,
            filteredLoans.length,
          )}{" "}
          of{" "}
          {
            filteredLoans.length
          }
        </span>

        <div className="pagination">
          <button
            type="button"
            disabled={
              safeCurrentPage ===
              1
            }
            onClick={() =>
              setCurrentPage(
                (page) =>
                  Math.max(
                    1,
                    page - 1,
                  ),
              )
            }
          >
            ‹
          </button>

          {Array.from(
            {
              length: Math.min(
                totalPages,
                5,
              ),
            },
            (_, index) =>
              index + 1,
          ).map((page) => (
            <button
              type="button"
              key={page}
              className={
                safeCurrentPage ===
                page
                  ? "current-page"
                  : ""
              }
              onClick={() =>
                setCurrentPage(
                  page,
                )
              }
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={
              safeCurrentPage ===
              totalPages
            }
            onClick={() =>
              setCurrentPage(
                (page) =>
                  Math.min(
                    totalPages,
                    page + 1,
                  ),
              )
            }
          >
            ›
          </button>
        </div>
      </footer>
      {assignmentLoan && (
        <div
          className="loan-officer-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeLoanOfficerPicker();
            }
          }}
        >
          <section
            className="loan-officer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-lo-title"
          >
            <header className="loan-officer-modal-header">
              <div>
                <h2 id="assign-lo-title">
                  Assign {
                    assignmentSlot === "primaryLO"
                      ? "Primary LO"
                      : assignmentSlot === "lo2"
                        ? "LO 2"
                        : "LO 3"
                  }
                </h2>

                <p>
                  Choose a Loan Officer for{" "}
                  <strong>
                    {assignmentLoan.borrower}
                  </strong>
                  .
                </p>

                {currentAssignedName && (
                  <p className="current-assignment">
                    Current:{" "}
                    <strong>
                      {currentAssignedName}
                    </strong>
                  </p>
                )}
              </div>

              <button
                type="button"
                className="loan-officer-modal-close"
                aria-label="Close"
                onClick={
                  closeLoanOfficerPicker
                }
                disabled={
                  assigningOfficer ||
                  removingOfficer
                }
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="loan-officer-modal-body">
              <div className="loan-officer-search">
                <input
                  type="search"
                  value={loanOfficerSearch}
                  placeholder="Search name or email..."
                  onChange={(event) =>
                    setLoanOfficerSearch(
                      event.target.value,
                    )
                  }
                  autoFocus
                />
              </div>

              {loadingLoanOfficers ? (
                <div className="loan-officer-loading">
                  Loading Loan Officers...
                </div>
              ) : (
                <div className="loan-officer-list">
                  {filteredLoanOfficers.length > 0 ? (
                    filteredLoanOfficers.map(
                      (officer) => (
                        <label
                          key={officer.id}
                          className={`loan-officer-option ${
                            selectedLoanOfficerId ===
                            String(officer.id)
                              ? "selected"
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="loanOfficer"
                            value={officer.id}
                            checked={
                              selectedLoanOfficerId ===
                              String(officer.id)
                            }
                            onChange={(event) =>
                              setSelectedLoanOfficerId(
                                event.target.value,
                              )
                            }
                          />

                          <span className="loan-officer-avatar">
                            {officer.name
                              .split(" ")
                              .map((part) =>
                                part.charAt(0),
                              )
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>

                          <span className="loan-officer-details">
                            <strong>
                              {officer.name}
                            </strong>

                            <small>
                              {officer.email}
                            </small>
                          </span>

                          <span className="loan-officer-check">
                            ✓
                          </span>
                        </label>
                      ),
                    )
                  ) : (
                    <p className="loan-officer-empty">
                      No matching active Loan Officer
                      was found.
                    </p>
                  )}
                </div>
              )}

              {assignmentError && (
                <div className="loan-officer-error">
                  {assignmentError}
                </div>
              )}
            </div>

            <footer className="loan-officer-modal-actions">
              {currentAssignedName && (
                <button
                  type="button"
                  className="loan-officer-remove"
                  onClick={() => {
                    void removeLoanOfficer();
                  }}
                  disabled={
                    assigningOfficer ||
                    removingOfficer
                  }
                >
                  {removingOfficer
                    ? "Removing..."
                    : "Remove Assignment"}
                </button>
              )}

              <button
                type="button"
                className="loan-officer-cancel"
                onClick={
                  closeLoanOfficerPicker
                }
                disabled={
                  assigningOfficer ||
                  removingOfficer
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="loan-officer-assign"
                onClick={() => {
                  void assignLoanOfficer();
                }}
                disabled={
                  loadingLoanOfficers ||
                  assigningOfficer ||
                  removingOfficer ||
                  !selectedLoanOfficerId
                }
              >
                {assigningOfficer
                  ? "Assigning..."
                  : "Assign Loan Officer"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}