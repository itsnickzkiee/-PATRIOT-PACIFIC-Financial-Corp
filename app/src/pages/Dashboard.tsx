import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  PauseOctagon,
  Flag,
  Lock,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router";
import {
  fundedTrend,
  STAGE_COLORS,
} from "../data/mock";

interface PipelineStage {
  stage: string;
  count: number;
  pct: number;
}

interface DashboardStats {
  activeLoans: number;
  fundedLoans: number;
  archivedLoans: number;
  closingThisWeek: number;
  urgentLocks: number;
  onHold: number;
  pipelineStages: PipelineStage[];
}

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 14,
  },

  show: (i: number) => ({
    opacity: 1,
    y: 0,

    transition: {
      delay: i * 0.06,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const RISK = [
  {
    name: "Critical (≤3d)",
    value: 3,
    color: "#a4123f",
  },
  {
    name: "Warning (4–7d)",
    value: 6,
    color: "#e8930c",
  },
  {
    name: "Safe",
    value: 71,
    color: "#ece5e1",
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeLoans: 0,
    fundedLoans: 0,
    archivedLoans: 0,
    closingThisWeek: 0,
    urgentLocks: 0,
    onHold: 0,
    pipelineStages: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/dashboard",
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load dashboard information.",
          );
        }

        const data: DashboardStats =
          await response.json();

        setStats(data);
      } catch (err) {
        console.error("Dashboard error:", err);

        setError(
          "Unable to load dashboard information from the backend.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboardStats();
  }, []);

  const closingPercentage = useMemo(() => {
    if (stats.activeLoans === 0) {
      return 0;
    }

    return Math.round(
      (stats.closingThisWeek / stats.activeLoans) *
        100,
    );
  }, [
    stats.activeLoans,
    stats.closingThisWeek,
  ]);

  const dashboardStats = [
    {
      icon: DollarSign,
      label: "Funded Loans",
      value: String(stats.fundedLoans),
      sub: `${stats.archivedLoans} archived`,
      tone:
        "bg-emerald-50 text-emerald-600 ring-emerald-100",
    },
    {
      icon: PauseOctagon,
      label: "On hold",
      value: String(stats.onHold),
      tone:
        "bg-stone-100 text-stone-500 ring-stone-200",
    },
    {
      icon: Flag,
      label: "Closing this week",
      value: String(stats.closingThisWeek),
      sub: `${closingPercentage}% of active`,
      tone:
        "bg-sky-50 text-sky-600 ring-sky-100",
    },
    {
      icon: Lock,
      label: "Urgent locks (≤3d)",
      value: String(stats.urgentLocks),
      sub: "expiring soon",
      tone:
        "bg-rose-50 text-rose-600 ring-rose-100",
    },
  ];

  const warningLocks = Math.max(
    0,
    stats.closingThisWeek - stats.urgentLocks,
  );

  const riskData = [
    {
      name: "Critical (≤3d)",
      value: stats.urgentLocks,
      color: "#a4123f",
    },
    {
      name: "Warning (4–7d)",
      value: warningLocks,
      color: "#e8930c",
    },
    {
      name: "Safe",
      value: Math.max(
        0,
        stats.activeLoans -
          stats.urgentLocks -
          warningLocks,
      ),
      color: "#ece5e1",
    },
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={0}
        className="card-shadow grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-[220px_repeat(4,1fr)]"
      >
        <div className="flex flex-col justify-center border-b border-border pb-5 md:border-b-0 md:border-r md:pb-0 md:pr-6">
          <span className="font-display text-6xl font-extrabold tracking-tight text-gradient-brand">
            {stats.activeLoans}
          </span>

          <span className="mt-1 text-sm font-medium text-muted-foreground">
            active loans in pipeline
          </span>
        </div>

        {dashboardStats.map((stat) => (
          <div
            key={stat.label}
            className="group flex items-start gap-3.5"
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110 ${stat.tone}`}
            >
              <stat.icon className="h-5 w-5" />
            </span>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </p>

              <p className="font-display text-2xl font-bold leading-tight">
                {stat.value}
              </p>

              {stat.sub && (
                <p className="text-[11px] text-muted-foreground">
                  {stat.sub}
                </p>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="card-shadow rounded-2xl border border-border bg-card p-6 xl:col-span-2"
        >
          <div className="mb-1 flex items-start justify-between">
            <div>
              <h2 className="font-display text-base font-bold">
                Active Pipeline by Stage
              </h2>

              <p className="text-xs text-muted-foreground">
                Distribution across {stats.activeLoans}{" "}
                active loans
              </p>
            </div>

            <Link
              to="/active"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition hover:border-rose-300 hover:text-rose-700"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 flex h-9 w-full overflow-hidden rounded-full bg-stone-100 ring-1 ring-black/5">
            {stats.pipelineStages.map(
              (stage, index) => (
                <motion.div
                  key={stage.stage}
                  initial={{
                    scaleX: 0,
                  }}
                  animate={{
                    scaleX: 1,
                  }}
                  transition={{
                    delay: 0.3 + index * 0.08,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  style={{
                    width: `${stage.pct}%`,
                    background:
                      STAGE_COLORS[stage.stage],
                    transformOrigin: "left",
                  }}
                  className="group relative h-full cursor-pointer border-r border-white/40 last:border-0 hover:brightness-110"
                  title={`${stage.stage}: ${stage.count} loans`}
                />
              ),
            )}
          </div>

          <div className="mt-6 space-y-3.5">
            {stats.pipelineStages.map(
              (stage, index) => (
                <motion.div
                  key={stage.stage}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={3 + index}
                  className="flex items-center gap-3"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background:
                        STAGE_COLORS[stage.stage],
                    }}
                  />

                  <span className="w-52 truncate text-sm font-medium text-foreground/90">
                    {stage.stage}
                  </span>

                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: `${stage.pct}%`,
                      }}
                      transition={{
                        delay: 0.4 + index * 0.07,
                        duration: 0.6,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${
                          STAGE_COLORS[stage.stage]
                        }cc, ${
                          STAGE_COLORS[stage.stage]
                        })`,
                      }}
                    />
                  </div>

                  <span className="w-28 text-right text-sm font-semibold tabular-nums">
                    {stage.count}{" "}
                    {stage.count === 1
                      ? "loan"
                      : "loans"}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {stage.pct}%
                    </span>
                  </span>
                </motion.div>
              ),
            )}
          </div>
        </motion.div>

        <div className="space-y-5">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="card-shadow rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Funded Trend
              </p>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                <ArrowUpRight className="h-3 w-3" />
                {stats.fundedLoans}
              </span>
            </div>

            <div className="mt-3 h-36">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={fundedTrend}
                  margin={{
                    top: 4,
                    right: 4,
                    bottom: 0,
                    left: 4,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="fundedGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#0e9f6e"
                        stopOpacity={0.35}
                      />

                      <stop
                        offset="100%"
                        stopColor="#0e9f6e"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 11,
                      fill: "#8d7f7a",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis hide domain={[0, 90]} />

                  <Tooltip
                    cursor={{
                      stroke: "#0e9f6e",
                      strokeDasharray: "3 3",
                    }}
                    contentStyle={{
                      borderRadius: 12,
                      border:
                        "1px solid #e7ded9",
                      fontSize: 12,
                      boxShadow:
                        "0 8px 24px rgba(0,0,0,0.08)",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="funded"
                    stroke="#0e9f6e"
                    strokeWidth={2.5}
                    fill="url(#fundedGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-muted-foreground">
              {stats.fundedLoans} funded loans stored
              in the database.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="card-shadow rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Rate Lock Risk
              </p>

              <span className="text-[11px] font-semibold text-muted-foreground">
                {stats.activeLoans === 0
                  ? 0
                  : Math.round(
                      (stats.urgentLocks /
                        stats.activeLoans) *
                        100,
                    )}
                % of pipeline
              </span>
            </div>

            <div className="mt-2 flex items-center gap-5">
              <div className="relative h-28 w-28 shrink-0">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={riskData}
                      dataKey="value"
                      innerRadius={36}
                      outerRadius={52}
                      paddingAngle={3}
                      strokeWidth={0}
                      startAngle={90}
                      endAngle={450}
                    >
                      {riskData.map((risk) => (
                        <Cell
                          key={risk.name}
                          fill={risk.color}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="font-display text-2xl font-extrabold text-rose-700">
                      {stats.urgentLocks}
                    </p>

                    <p className="-mt-0.5 text-[9px] font-medium leading-tight text-muted-foreground">
                      expiring
                      <br />≤ 3 days
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2.5">
                {riskData
                  .slice(0, 2)
                  .map((risk) => (
                    <div
                      key={risk.name}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background:
                            risk.color,
                        }}
                      />

                      <span className="flex-1 text-muted-foreground">
                        {risk.name}
                      </span>

                      <span className="font-display font-bold tabular-nums">
                        {risk.value}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="card-shadow rounded-2xl border border-border bg-card p-5"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Needs Attention
            </p>

            <p className="text-xs text-muted-foreground">
              Flagged loans that may need a follow-up
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2.5 rounded-xl bg-rose-50/70 px-3 py-2.5 ring-1 ring-rose-100">
                <span className="h-2 w-2 rounded-full bg-rose-600" />

                <span className="flex-1 text-sm font-medium">
                  Locks expiring in ≤3 days
                </span>

                <span className="font-display text-lg font-extrabold text-rose-700">
                  {stats.urgentLocks}
                </span>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl bg-stone-50 px-3 py-2.5 ring-1 ring-stone-100">
                <span className="h-2 w-2 rounded-full bg-stone-400" />

                <span className="flex-1 text-sm font-medium text-muted-foreground">
                  Loans on hold
                </span>

                <span className="font-display text-lg font-extrabold text-stone-500">
                  {stats.onHold}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}