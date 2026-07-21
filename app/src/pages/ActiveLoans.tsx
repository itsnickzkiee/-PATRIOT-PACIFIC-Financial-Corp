import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router";

import {
  netCommission,
  fmtMoney,
} from "@/data/mock";
import type { Loan } from "@/data/mock";
import { useAuth } from "@/state/AuthContext";

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
  }, []);

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

  function openEditLoan(
    loanId: string,
  ) {
    if (!canEdit) {
      return;
    }

    navigate(
      `/loans/${loanId}/edit`,
    );
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
                    onClick={
                      canEdit
                        ? () =>
                            openEditLoan(
                              loan.id,
                            )
                        : undefined
                    }
                    style={{
                      cursor: canEdit
                        ? "pointer"
                        : "default",
                    }}
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
                      <strong>
                        {
                          loan.primaryLO
                        }
                      </strong>
                    </td>

                    <td>
                      {loan.lo2 ? (
                        <span>
                          {loan.lo2}
                        </span>
                      ) : (
                        <em className="unassigned">
                          No LO
                          assigned
                        </em>
                      )}
                    </td>

                    <td>
                      {loan.lo3 ? (
                        <span>
                          {loan.lo3}
                        </span>
                      ) : canEdit ? (
                        <button
                          type="button"
                          className="add-lo-button"
                          aria-label={`Add third loan officer for ${loan.borrower}`}
                          onClick={(
                            event,
                          ) => {
                            event.stopPropagation();

                            openEditLoan(
                              loan.id,
                            );
                          }}
                        >
                          +
                        </button>
                      ) : (
                        <em className="unassigned">
                          No LO assigned
                        </em>
                      )}
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
                        {canEdit && (
                          <button
                            type="button"
                            title="Edit loan"
                            aria-label="Edit loan"
                            onClick={(
                              event,
                            ) => {
                              event.stopPropagation();

                              openEditLoan(
                                loan.id,
                              );
                            }}
                          >
                            ☷
                          </button>
                        )}

                        <button
                          type="button"
                          className={
                            loan.hasNotes
                              ? "has-update"
                              : ""
                          }
                          title="View notes"
                          aria-label="View notes"
                          onClick={(
                            event,
                          ) => {
                            event.stopPropagation();
                          }}
                        >
                          ▧
                        </button>

                        <button
                          type="button"
                          className={
                            loan.filesCount >
                            0
                              ? "has-update"
                              : ""
                          }
                          title={`${loan.filesCount} files`}
                          aria-label={`${loan.filesCount} files`}
                          onClick={(
                            event,
                          ) => {
                            event.stopPropagation();
                          }}
                        >
                          ▱
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
    </section>
  );
}