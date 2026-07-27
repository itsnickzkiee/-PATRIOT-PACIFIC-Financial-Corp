import { useEffect, useMemo, useState } from "react";
import "@/styles/loan-dashboard.css";
import { useAuth } from "@/state/AuthContext";

const API_URL = "http://localhost:5000/api";

type LoanRecord = {
  id?: string | number;
  arriveId?: string | number;

  borrower?: string;
  borrowerName?: string;

  status?: string;
  state?: string;
  primaryLO?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
  fundedDate?: string | null;
  calcCompleted?: string | null;
  payrollProcessed?: string | null;
  closingDate?: string | null;
  lockExpiration?: string | null;

  netCommission?: number | string | null;
};

type StageInformation = {
  name: string;
  count: number;
  percentage: number;
  color: string;
};

type ActivityRecord = {
  id: string;
  borrower: string;
  status: string;
  date: Date | null;
  stageLevel: number;
};

const LOAN_STAGES = [
  "Loan Setup",
  "Disclosed",
  "Submitted to Underwriting",
  "Docs Out",
  "Clear to Close",
  "Docs Signed",
  "Loan Funded",
] as const;

const STAGE_COLORS: Record<string, string> = {
  "Loan Setup": "#f3a51f",
  Disclosed: "#ed7a23",
  "Submitted to Underwriting": "#de512d",
  "Docs Out": "#c93445",
  "Clear to Close": "#a62151",
  "Docs Signed": "#74133f",
  "Loan Funded": "#178c74",
};

function parseLoanDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getLoanDate(loan: LoanRecord): Date | null {
  return (
    parseLoanDate(loan.updatedAt) ??
    parseLoanDate(loan.createdAt) ??
    parseLoanDate(loan.fundedDate) ??
    parseLoanDate(loan.calcCompleted) ??
    parseLoanDate(loan.payrollProcessed) ??
    null
  );
}

function getBorrowerName(loan: LoanRecord): string {
  return (
    loan.borrower ??
    loan.borrowerName ??
    "Unknown Borrower"
  );
}

function getLoanId(loan: LoanRecord): string {
  return String(
    loan.arriveId ??
      loan.id ??
      "N/A"
  );
}

function isSameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function isWithinCurrentWeek(date: Date, currentDate: Date): boolean {
  const weekStart = new Date(currentDate);
  const currentDay = weekStart.getDay();

  const daysFromMonday =
    currentDay === 0 ? 6 : currentDay - 1;

  weekStart.setDate(
    weekStart.getDate() - daysFromMonday
  );

  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return date >= weekStart && date < weekEnd;
}

function formatDate(date: Date | null): string {
  if (!date) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatShortDate(date: Date | null): string {
  if (!date) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTime(date: Date | null): string {
  if (!date) {
    return "No time";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Dashboard() {
  const { user } = useAuth();

  const [records, setRecords] =
    useState<LoanRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedStage, setSelectedStage] =
    useState<string | null>(null);

  const [hoveredActivity, setHoveredActivity] =
    useState<ActivityRecord | null>(null);

  useEffect(() => {
    async function loadLoans() {
      if (!user?.id) {
        setRecords([]);
        setLoading(false);
        setError(
          "A logged-in user is required.",
        );
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/loans`,
          {
            headers: {
              "x-user-id": String(user.id),
            },
          },
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to load dashboard loans.",
          );
        }

        const data =
          result as LoanRecord[];

        setRecords(data);
      } catch (err) {
        console.error(
          "Dashboard load error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadLoans();

    const intervalId =
      window.setInterval(() => {
        void loadLoans();
      }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user?.id]);

  const currentDate = new Date();

  const activeLoans = records.filter(
    (loan) => loan.status !== "Loan Funded"
  );

  const fundedLoans = records.filter(
    (loan) => loan.status === "Loan Funded"
  );

  const activeToday = activeLoans.filter((loan) => {
    const date = getLoanDate(loan);

    return date
      ? isSameDay(date, currentDate)
      : false;
  }).length;

  const activeThisWeek = activeLoans.filter((loan) => {
    const date = getLoanDate(loan);

    return date
      ? isWithinCurrentWeek(date, currentDate)
      : false;
  }).length;

  const fundedToday = fundedLoans.filter((loan) => {
    const date =
      parseLoanDate(loan.fundedDate) ??
      getLoanDate(loan);

    return date
      ? isSameDay(date, currentDate)
      : false;
  }).length;

  const fundedThisWeek = fundedLoans.filter((loan) => {
    const date =
      parseLoanDate(loan.fundedDate) ??
      getLoanDate(loan);

    return date
      ? isWithinCurrentWeek(date, currentDate)
      : false;
  }).length;

  const onHoldCount = records.filter((loan) =>
    String(loan.status)
      .toLowerCase()
      .includes("hold")
  ).length;

  const urgentLockCount = records.filter((loan) => {
    const expirationDate = parseLoanDate(
      loan.lockExpiration
    );

    if (!expirationDate) {
      return false;
    }

    const difference =
      expirationDate.getTime() -
      currentDate.getTime();

    const daysRemaining =
      difference / (1000 * 60 * 60 * 24);

    return daysRemaining >= 0 && daysRemaining <= 7;
  }).length;

  const closingThisWeek = records.filter((loan) => {
    const closingDate = parseLoanDate(
      loan.closingDate
    );

    return closingDate
      ? isWithinCurrentWeek(
          closingDate,
          currentDate
        )
      : false;
  }).length;

  const totalCommission = records.reduce(
    (total, loan) => {
      const commission =
        typeof loan.netCommission === "number"
          ? loan.netCommission
          : Number(loan.netCommission ?? 0);

      return total + (Number.isNaN(commission) ? 0 : commission);
    },
    0
  );

  const stageInformation = useMemo<StageInformation[]>(() => {
    const totalLoans = records.length || 1;

    return LOAN_STAGES.map((stage) => {
      const count = records.filter(
        (loan) => loan.status === stage
      ).length;

      return {
        name: stage,
        count,
        percentage: Math.round(
          (count / totalLoans) * 100
        ),
        color: STAGE_COLORS[stage],
      };
    });
  }, [records]);

  const pieChartBackground = useMemo(() => {
    const total =
      stageInformation.reduce(
        (sum, stage) => sum + stage.count,
        0
      ) || 1;

    let currentPercentage = 0;

    const segments = stageInformation.map((stage) => {
      const start = currentPercentage;

      currentPercentage +=
        (stage.count / total) * 100;

      return `${stage.color} ${start}% ${currentPercentage}%`;
    });

    return `conic-gradient(${segments.join(", ")})`;
  }, [stageInformation]);

  const activityRecords = useMemo<ActivityRecord[]>(() => {
    return [...records]
      .map((loan) => {
        const status =
          loan.status ?? "Unknown Status";

        const stageIndex =
          LOAN_STAGES.indexOf(
            status as (typeof LOAN_STAGES)[number]
          );

        return {
          id: getLoanId(loan),
          borrower: getBorrowerName(loan),
          status,
          date: getLoanDate(loan),
          stageLevel:
            stageIndex >= 0
              ? stageIndex + 1
              : 1,
        };
      })
      .sort((first, second) => {
        const firstTime =
          first.date?.getTime() ?? 0;

        const secondTime =
          second.date?.getTime() ?? 0;

        return secondTime - firstTime;
      })
      .slice(0, 8)
      .reverse();
  }, [records]);

  const maximumStageLevel = LOAN_STAGES.length;

  return (
    <div className="loan-dashboard">
      <section className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">
            LOAN MANAGEMENT OVERVIEW
          </span>

          <h1>Dashboard</h1>

          <p>
            Monitor loan activity, pipeline progress,
            funding, commissions, and recent records.
          </p>
        </div>

        <div className="dashboard-date">
          <span>Today</span>
          <strong>
            {formatDate(currentDate)}
          </strong>
        </div>
      </section>

      {error && (
        <div className="dashboard-data-error">
          {error}
        </div>
      )}

      <section className="loan-summary-grid">
        <article className="summary-card primary-summary">
          <div className="summary-header">
            <div className="summary-icon">▦</div>

            <div>
              <span>Active Loans in Pipeline</span>
              <strong>{loading ? "—" : activeLoans.length}</strong>
            </div>
          </div>

          <div className="summary-comparison">
            <div>
              <span>Today</span>
              <strong>{activeToday}</strong>
            </div>

            <div>
              <span>This Week</span>
              <strong>{activeThisWeek}</strong>
            </div>
          </div>
        </article>

        <article className="summary-card funded-summary">
          <div className="summary-header">
            <div className="summary-icon">✓</div>

            <div>
              <span>Funded Loans</span>
              <strong>{loading ? "—" : fundedLoans.length}</strong>
            </div>
          </div>

          <div className="summary-comparison">
            <div>
              <span>Today</span>
              <strong>{fundedToday}</strong>
            </div>

            <div>
              <span>This Week</span>
              <strong>{fundedThisWeek}</strong>
            </div>
          </div>
        </article>

        <article className="mini-summary-card">
          <span>On Hold</span>
          <strong>{loading ? "—" : onHoldCount}</strong>
          <small>Loans requiring attention</small>
        </article>

        <article className="mini-summary-card">
          <span>Closing This Week</span>
          <strong>{loading ? "—" : closingThisWeek}</strong>
          <small>Upcoming loan closings</small>
        </article>

        <article className="mini-summary-card warning-card">
          <span>Urgent Rate Locks</span>
          <strong>{loading ? "—" : urgentLockCount}</strong>
          <small>Expiring within seven days</small>
        </article>

        <article className="mini-summary-card commission-card">
          <span>Net Commission</span>
          <strong>
            {loading
              ? "—"
              : formatMoney(totalCommission)}
          </strong>
          <small>Total recorded commission</small>
        </article>
      </section>

      <section className="dashboard-main-layout">
        <article className="dashboard-panel loan-stage-panel">
          <div className="panel-title">
            <div>
              <h2>Loan Pipeline Distribution</h2>
              <p>
                Current loans grouped by pipeline stage
              </p>
            </div>

            <span className="loan-total-badge">
              {records.length} total loans
            </span>
          </div>

          <div className="pie-chart-layout">
            <div className="pie-chart-container">
              <div
                className="real-pie-chart"
                style={{
                  background: pieChartBackground,
                }}
              >
                <div className="pie-chart-center">
                  <strong>{records.length}</strong>
                  <span>Total Loans</span>
                </div>
              </div>
            </div>

            <div className="pie-information">
              {stageInformation.map((stage) => (
                <button
                  type="button"
                  key={stage.name}
                  className={`pie-information-item ${
                    selectedStage === stage.name
                      ? "selected"
                      : ""
                  }`}
                  onMouseEnter={() =>
                    setSelectedStage(stage.name)
                  }
                  onMouseLeave={() =>
                    setSelectedStage(null)
                  }
                  onFocus={() =>
                    setSelectedStage(stage.name)
                  }
                  onBlur={() =>
                    setSelectedStage(null)
                  }
                >
                  <span
                    className="stage-color"
                    style={{
                      backgroundColor: stage.color,
                    }}
                  />

                  <span className="stage-description">
                    <strong>{stage.name}</strong>
                    <small>
                      {stage.count} loan
                      {stage.count === 1 ? "" : "s"}
                    </small>
                  </span>

                  <strong className="stage-percentage">
                    {stage.percentage}%
                  </strong>
                </button>
              ))}
            </div>
          </div>
        </article>

        <article className="dashboard-panel activity-chart-panel">
          <div className="panel-title">
            <div>
              <h2>Recent Loan Activity</h2>
              <p>
                Real loan records by stage, date, and time
              </p>
            </div>
          </div>

          <div className="activity-chart">
            <div className="activity-axis-labels">
              <span>Funded</span>
              <span>Docs</span>
              <span>Underwriting</span>
              <span>Setup</span>
            </div>

            <div className="activity-chart-area">
              <div className="activity-grid-lines">
                <i />
                <i />
                <i />
                <i />
              </div>

              <div className="activity-bars">
                {activityRecords.map((activity) => (
                  <button
                    type="button"
                    className="activity-bar-column"
                    key={`${activity.id}-${activity.borrower}`}
                    onMouseEnter={() =>
                      setHoveredActivity(activity)
                    }
                    onMouseLeave={() =>
                      setHoveredActivity(null)
                    }
                    onFocus={() =>
                      setHoveredActivity(activity)
                    }
                    onBlur={() =>
                      setHoveredActivity(null)
                    }
                  >
                    <span
                      className="activity-bar"
                      style={{
                        height: `${
                          (activity.stageLevel /
                            maximumStageLevel) *
                          100
                        }%`,
                        backgroundColor:
                          STAGE_COLORS[
                            activity.status
                          ] ?? "#64748b",
                      }}
                    />

                    <small>
                      {formatShortDate(activity.date)}
                    </small>
                  </button>
                ))}
              </div>

              {hoveredActivity && (
                <div className="activity-tooltip">
                  <strong>
                    {hoveredActivity.borrower}
                  </strong>

                  <span>
                    ID: {hoveredActivity.id}
                  </span>

                  <span>
                    Status: {hoveredActivity.status}
                  </span>

                  <span>
                    Date:{" "}
                    {formatDate(
                      hoveredActivity.date
                    )}
                  </span>

                  <span>
                    Time:{" "}
                    {formatTime(
                      hoveredActivity.date
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-panel recent-records-panel">
        <div className="panel-title">
          <div>
            <h2>Latest Loan Records</h2>
            <p>
              Most recently updated borrower records
            </p>
          </div>
        </div>

        <div className="loan-table-wrapper">
          <table className="loan-dashboard-table">
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Loan ID</th>
                <th>Status</th>
                <th>Primary LO</th>
                <th>State</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              {[...records]
                .sort((first, second) => {
                  const firstTime =
                    getLoanDate(first)?.getTime() ?? 0;

                  const secondTime =
                    getLoanDate(second)?.getTime() ?? 0;

                  return secondTime - firstTime;
                })
                .slice(0, 6)
                .map((loan) => {
                  const date = getLoanDate(loan);

                  return (
                    <tr key={getLoanId(loan)}>
                      <td>
                        <strong>
                          {getBorrowerName(loan)}
                        </strong>
                      </td>

                      <td>{getLoanId(loan)}</td>

                      <td>
                        <span
                          className="loan-status-badge"
                          style={{
                            color:
                              STAGE_COLORS[
                                loan.status ?? ""
                              ] ?? "#475569",
                            backgroundColor: `${
                              STAGE_COLORS[
                                loan.status ?? ""
                              ] ?? "#64748b"
                            }18`,
                          }}
                        >
                          {loan.status ??
                            "Unknown Status"}
                        </span>
                      </td>

                      <td>
                        {loan.primaryLO ?? "N/A"}
                      </td>

                      <td>{loan.state ?? "N/A"}</td>

                      <td>{formatDate(date)}</td>

                      <td>{formatTime(date)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}