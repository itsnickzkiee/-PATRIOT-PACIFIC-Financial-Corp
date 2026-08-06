import { useEffect, useState, type ComponentType } from "react";

import { NavLink, Outlet, useLocation, useNavigate } from "react-router";

import {
  LayoutDashboard,
  Landmark,
  BadgeDollarSign,
  Archive,
  Users,
  Search,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  User,
  Settings,
  LogOut,
  CheckCircle2,
  Database,
  Wifi,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";

import { AnimatePresence, motion } from "framer-motion";

import { useWorkspace } from "../state/workspace";

import { avatarPalette, initialsOf } from "../data/mock";

import LoanDetailsSheet from "./LoanDetailsSheet";
import LoanNotesSheet from "./LoanNotesSheet";
import LoanFilesSheet from "./LoanFilesSheet";
import { useAuth } from "../state/AuthContext";

interface NavigationItem {
  to: string;
  label: string;
  icon: ComponentType<{
    className?: string;
  }>;
  end?: boolean;
}

const LOAN_NAVIGATION: NavigationItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/active",
    label: "Active Loans",
    icon: Landmark,
  },
  {
    to: "/funded",
    label: "Funded Loans",
    icon: BadgeDollarSign,
  },
  {
    to: "/archived",
    label: "Archived Loans",
    icon: Archive,
  },
  {
    to: "/loans/new",
    label: "Add Loan",
    icon: PlusCircle,
  },
];

const OTHER_NAVIGATION: NavigationItem[] = [
  {
    to: "/users",
    label: "User Management",
    icon: Users,
  },
];

const TITLES: Record<
  string,
  {
    title: string;
    sub: string;
  }
> = {
  "/": {
    title: "Pipeline Overview",
    sub: "Real-time snapshot of every active loan in the pipeline.",
  },

  "/active": {
    title: "Active Loans",
    sub: "Loans currently moving through the pipeline.",
  },

  "/funded": {
    title: "Loans & Commissions",
    sub: "Funded loans, compensation status and payouts.",
  },

  "/archived": {
    title: "Archived Loans",
    sub: "Historical record of completed files.",
  },

  "/loans/new": {
    title: "Add New Loan",
    sub: "Create a new loan record and save it to the database.",
  },

  "/profile": {
    title: "Admin Profile",
    sub: "View administrator information, account details and permissions.",
  },

  "/users": {
    title: "User Management",
    sub: "Invite, manage and deactivate team members.",
  },

  "/knowledge-base": {
    title: "Knowledge Base",
    sub: "Guides and answers for common tasks.",
  },
};

type NotificationRecord = {
  id: number;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  notifications?: NotificationRecord[];
  message?: string;
};

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

type LoanCountRecord = {
  status: string;
};

type LoanCounts = {
  active: number;
  funded: number;
  archived: number;
};

const ACTIVE_LOAN_STATUSES = [
  "Loan Setup",
  "Disclosed",
  "Submitted to Underwriting",
  "Approved w/ Conditions",
  "Re-submittal",
  "Clear to Close",
  "Docs Out",
  "Docs Signed",
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-800 shadow-lg shadow-rose-950/40 ring-1 ring-white/20">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 text-amber-300"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2l2.1 4.9 5.3.4-4 3.5 1.2 5.2L12 13.6 7.4 16l1.2-5.2-4-3.5 5.3-.4L12 2z" />
        </svg>

        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-[#30060f]" />
      </div>

      <div className="leading-tight">
        <p className="font-display text-[15px] font-extrabold tracking-wide text-white">
          PATRIOT PACIFIC
        </p>

        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rose-200/70">
          Financial Corp
        </p>
      </div>
    </div>
  );
}

function SidebarNavigationLink({
  item,
  layoutId,
  count,
}: {
  item: NavigationItem;
  layoutId: string;
  count?: number;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${isActive
          ? "bg-white/10 text-white ring-1 ring-white/10"
          : "text-rose-100/60 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId={layoutId}
              className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-amber-400"
            />
          )}

          <Icon className="h-[17px] w-[17px] shrink-0" />

          <span>{item.label}</span>

          {typeof count === "number" && count > 0 && (
            <span className="ml-auto min-w-[25px] rounded-full bg-amber-400/15 px-2 py-0.5 text-center text-[10px] font-bold text-amber-300 ring-1 ring-amber-400/30">
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const userRole = user?.role?.trim() ?? "";
  const isAdmin = userRole === "Super Admin" || userRole === "Admin";

  const visibleLoanNavigation = LOAN_NAVIGATION.filter(
    (item) => item.to !== "/loans/new" || isAdmin,
  );

  const displayName = user?.name?.trim() || "Administrator";
  const displayEmail = user?.email || "admin@patriotpacific.com";

  const { toasts, dismissToast, pushToast } = useWorkspace();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  const [showProfile, setShowProfile] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);

  const [showStatus, setShowStatus] = useState(false);

  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  const [isShellLoading, setIsShellLoading] = useState(true);

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  const [loanCounts, setLoanCounts] = useState<LoanCounts>({
    active: 0,
    funded: 0,
    archived: 0,
  });

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const isEditLoanPage =
    location.pathname.startsWith("/loans/") &&
    location.pathname.endsWith("/edit");

  const meta = isEditLoanPage
    ? {
      title: "Edit Loan",
      sub: "Update loan information and save the changes to the database.",
    }
    : (TITLES[location.pathname] ?? TITLES["/"]);

  async function loadLoanCounts(): Promise<void> {
    if (!user?.id) {
      setLoanCounts({
        active: 0,
        funded: 0,
        archived: 0,
      });

      return;
    }

    try {
      const response = await fetch(`${API_URL}/loans`, {
        headers: {
          "x-user-id": String(user.id),
        },
      });

      if (!response.ok) {
        throw new Error("Unable to load loan counts.");
      }

      const loans = (await response.json()) as LoanCountRecord[];

      setLoanCounts({
        active: loans.filter((loan) =>
          ACTIVE_LOAN_STATUSES.includes(loan.status),
        ).length,

        funded: loans.filter(
          (loan) => loan.status === "Loan Funded",
        ).length,

        archived: loans.filter(
          (loan) => loan.status === "Closed",
        ).length,
      });
    } catch (error) {
      console.error("Load loan counts error:", error);
    }
  }

  async function loadNotifications(): Promise<void> {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/notifications?userId=${user.id}`,
      );

      const data = (await response.json()) as NotificationsResponse;

      if (!response.ok) {
        throw new Error(data.message ?? "Unable to load notifications.");
      }

      setNotifications(data.notifications ?? []);
    } catch (error) {
      console.error("Load notifications error:", error);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitialWorkspace(): Promise<void> {
      setIsShellLoading(true);

      await Promise.all([loadNotifications(), loadLoanCounts()]);

      if (mounted) {
        setIsShellLoading(false);
      }
    }

    void loadInitialWorkspace();

    const intervalId = window.setInterval(() => {
      void loadNotifications();
      void loadLoanCounts();
    }, 15000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [user?.id]);

  useEffect(() => {
    const adminOnlyPage =
      location.pathname === "/users" || location.pathname === "/loans/new";

    if (adminOnlyPage && !isAdmin) {
      pushToast("You do not have permission to open that page.");
      navigate("/", { replace: true });
    }
  }, [isAdmin, location.pathname, navigate, pushToast]);

  function openProfilePage() {
    setShowProfile(false);
    navigate("/profile");
  }

  async function markAllNotificationsAsRead(): Promise<void> {
    if (!user) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to mark notifications as read.");
      }

      setNotifications((items) =>
        items.map((notification) => ({
          ...notification,
          read: true,
        })),
      );
    } catch (error) {
      console.error("Mark all notifications error:", error);

      pushToast("Unable to update notifications.");
    }
  }

  async function markNotificationAsRead(
    notificationId: number,
  ): Promise<boolean> {
    if (!user?.id) {
      pushToast(
        "A logged-in user is required.",
      );

      return false;
    }

    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            "x-user-id": String(user.id),
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ??
          "Unable to update notification.",
        );
      }

      setNotifications((items) =>
        items.map((notification) =>
          notification.id === notificationId
            ? {
              ...notification,
              read: true,
            }
            : notification,
        ),
      );

      return true;
    } catch (error) {
      console.error(
        "Mark notification error:",
        error,
      );

      pushToast(
        error instanceof Error
          ? error.message
          : "Unable to update notification.",
      );

      return false;
    }
  }

  function confirmLogout(): void {
    setShowLogoutConfirmation(false);
    setShowProfile(false);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* Collapsible sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 256 : 0,
        }}
        transition={{
          duration: 0.28,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="sidebar-gradient relative hidden shrink-0 border-r border-white/5 md:block"
      >
        <motion.div
          initial={false}
          animate={{
            opacity: sidebarOpen ? 1 : 0,
            x: sidebarOpen ? 0 : -30,
          }}
          transition={{
            duration: 0.2,
          }}
          className="flex h-full w-64 flex-col"
          style={{
            pointerEvents: sidebarOpen ? "auto" : "none",
          }}
        >
          {/* Brand */}
          <div className="px-5 pb-6 pt-6">
            <BrandMark />
          </div>

          {/* Workspace dropdown */}
          <div className="mx-5 mb-2 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
            <div className="px-3.5 pb-2 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-200/60">
                Workspace
              </p>

              <button
                type="button"
                onClick={() => setWorkspaceOpen((current) => !current)}
                aria-expanded={workspaceOpen}
                className="mt-1 flex w-full items-center justify-between rounded-lg py-1 text-left text-sm font-semibold text-white transition hover:text-rose-100"
              >
                <span>Loans and Commissions</span>

                <motion.span
                  animate={{
                    rotate: workspaceOpen ? 180 : 0,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                >
                  <ChevronDown className="h-4 w-4 text-rose-200/60" />
                </motion.span>
              </button>
            </div>

            <AnimatePresence initial={false}>
              {workspaceOpen && (
                <motion.div
                  initial={{
                    height: 0,
                    opacity: 0,
                  }}
                  animate={{
                    height: "auto",
                    opacity: 1,
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className="overflow-hidden"
                >
                  <nav className="space-y-1 border-t border-white/10 px-2 pb-2 pt-2">
                    {visibleLoanNavigation.map((item) => {
                      const count =
                        item.to === "/active"
                          ? loanCounts.active
                          : item.to === "/funded"
                            ? loanCounts.funded
                            : item.to === "/archived"
                              ? loanCounts.archived
                              : undefined;

                      return (
                        <SidebarNavigationLink
                          key={item.to}
                          item={item}
                          layoutId="workspace-navigation-active"
                          count={count}
                        />
                      );
                    })}
                  </nav>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Other navigation */}
          <nav className="flex-1 space-y-1 px-3 pt-2">
            {isAdmin &&
              OTHER_NAVIGATION.map((item) => (
                <SidebarNavigationLink
                  key={item.to}
                  item={item}
                  layoutId="other-navigation-active"
                />
              ))}
          </nav>

          {/* Knowledge Base */}
          <div className="px-3 pb-3">
            <NavLink
              to="/knowledge-base"
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${isActive
                  ? "bg-white/10 text-white ring-1 ring-white/10"
                  : "text-rose-100/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <BookOpen className="h-[18px] w-[18px]" />
              Knowledge Base
            </NavLink>
          </div>

          {/* Sidebar profile */}
          <div className="relative border-t border-white/10 p-4">
            <button
              type="button"
              onClick={() => setShowProfile((current) => !current)}
              className="flex w-full items-center gap-3 rounded-xl p-1 text-left transition hover:bg-white/5"
            >
              <div
                className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ring-2 ring-amber-400/70 ${avatarPalette(displayName)}`}
              >
                {initialsOf(displayName)}
              </div>

              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-semibold text-white">
                  {displayName}
                </p>

                <p className="truncate text-[10px] text-rose-100/50">
                  {displayEmail}
                </p>

                <p className="text-[11px] text-emerald-400">
                  ● Online — {userRole || "User"}
                </p>
              </div>

              <ChevronDown className="h-4 w-4 text-rose-100/60" />
            </button>

            {showProfile && (
              <div className="absolute bottom-[72px] left-3 right-3 z-50 overflow-hidden rounded-xl border border-white/10 bg-[#2a0713] p-1 shadow-2xl">
                <button
                  type="button"
                  onClick={openProfilePage}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <User className="h-4 w-4" />
                  View Profile
                </button>

                <button
                  type="button"
                  onClick={() => pushToast("Account settings opened")}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                  Account Settings
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    setShowLogoutConfirmation(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Close-sidebar arrow */}
        {sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            title="Hide sidebar"
            aria-label="Hide sidebar"
            className="absolute -right-4 top-1/2 z-50 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-rose-950/20 bg-[#4b0a1c] text-white shadow-lg transition hover:scale-105 hover:bg-[#6d102c]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </motion.aside>

      {/* Open-sidebar arrow when sidebar is hidden */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            type="button"
            initial={{
              opacity: 0,
              x: -20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -20,
            }}
            onClick={() => setSidebarOpen(true)}
            title="Show sidebar"
            aria-label="Show sidebar"
            className="fixed left-2 top-1/2 z-50 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-rose-950/20 bg-[#4b0a1c] text-white shadow-lg transition hover:scale-105 hover:bg-[#6d102c] md:grid"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="glass sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-white/40 px-6 shadow-[0_10px_35px_rgba(42,7,19,0.08)] backdrop-blur-xl">
          <div className="min-w-0">
            <h1 className="font-display truncate text-lg font-bold text-foreground">
              {meta.title}
            </h1>
          </div>

          {/* Search */}
          <div className="relative ml-auto hidden w-72 lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              placeholder="Search borrower, LO, ID…"
              className="h-[38px] w-full rounded-full border border-input bg-white/90 py-2 pl-9 pr-14 text-sm shadow-[0_6px_20px_rgba(42,7,19,0.06)] outline-none transition-all duration-300 hover:shadow-[0_10px_28px_rgba(42,7,19,0.09)] focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
            />

            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          {/* Live status */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatus((current) => !current)}
              className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 sm:flex"
            >
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </button>

            {showStatus && (
              <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-border bg-white p-4 shadow-2xl">
                <p className="font-semibold text-foreground">System Status</p>

                <div className="mt-3 space-y-2 text-sm">
                  <StatusRow icon={Wifi} label="Application server" />

                  <StatusRow icon={Database} label="Database" />

                  <StatusRow icon={ShieldCheck} label="Security services" />
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  All systems operational
                </p>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications((current) => !current);
                void loadNotifications();
              }}
              className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition hover:text-foreground"
            >
              <Bell className="h-[18px] w-[18px]" />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <p className="font-semibold">Notifications</p>

                    <p className="text-xs text-muted-foreground">
                      {unreadCount} unread
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="text-xs font-semibold text-rose-700 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto p-2">
                  {notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={async () => {
                        const updated =
                          await markNotificationAsRead(
                            notification.id,
                          );

                        if (!updated) {
                          return;
                        }

                        setShowNotifications(false);

                        if (
                          notification.type ===
                          "password_reset_request"
                        ) {
                          navigate("/users");
                        }
                      }}
                      className={`flex w-full gap-3 rounded-xl px-3 py-3 text-left text-sm transition hover:bg-muted ${notification.read
                          ? "text-muted-foreground"
                          : "bg-rose-50/60 font-medium text-foreground"
                        }`}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? "bg-stone-300" : "bg-rose-600"
                          }`}
                      />

                      {notification.message}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top profile avatar */}
          <button
            type="button"
            onClick={openProfilePage}
            title="Open profile"
            className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ring-2 ring-rose-200 transition hover:ring-rose-400 ${avatarPalette(displayName)}`}
          >
            {initialsOf(displayName)}
          </button>
        </header>

        {/* Page content */}
        <main className="hero-glow min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-6 pb-10 pt-6">
            <p className="mb-5 text-sm text-muted-foreground">{meta.sub}</p>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.995 }}
                transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
            © 2026 Patriot Pacific Financial Corp. All rights reserved.
          </footer>
        </main>
      </div>

      {/* Initial workspace loading state — frontend only */}
      <AnimatePresence>
        {isShellLoading && (
          <motion.div
            className="fixed inset-0 z-[190] grid place-items-center bg-[#f8f5f6]/75 px-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-sm rounded-3xl border border-white/70 bg-white/85 p-7 text-center shadow-[0_30px_100px_rgba(42,7,19,0.22)] ring-1 ring-rose-950/5 backdrop-blur-2xl"
            >
              <div className="relative mx-auto grid h-16 w-16 place-items-center">
                <motion.span
                  className="absolute inset-0 rounded-full border-4 border-rose-100"
                  aria-hidden="true"
                />

                <motion.span
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-rose-700"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.9,
                    ease: "linear",
                    repeat: Infinity,
                  }}
                  aria-hidden="true"
                />

                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-rose-600 to-[#4b0a1c] text-amber-300 shadow-lg shadow-rose-950/25"
                >
                  <Database className="h-5 w-5" />
                </motion.div>
              </div>

              <h2 className="mt-5 font-display text-lg font-bold text-foreground">
                Loading workspace
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Preparing loans, notifications and dashboard information.
              </p>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-rose-100">
                <motion.div
                  className="h-full w-1/2 rounded-full bg-gradient-to-r from-rose-500 to-[#4b0a1c]"
                  animate={{ x: ["-110%", "210%"] }}
                  transition={{
                    duration: 1.15,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout confirmation dialog */}
      <AnimatePresence>
        {showLogoutConfirmation && (
          <motion.div
            className="fixed inset-0 z-[200] grid place-items-center bg-black/45 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setShowLogoutConfirmation(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-dialog-title"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onMouseDown={(event) => event.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white/95 p-6 shadow-[0_28px_90px_rgba(42,7,19,0.35)] backdrop-blur-xl"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-700 ring-1 ring-rose-200">
                  <LogOut className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2
                    id="logout-dialog-title"
                    className="font-display text-lg font-bold text-foreground"
                  >
                    Confirm logout
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Are you sure you want to log out of your account?
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirmation(false)}
                  className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted active:scale-[0.98]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmLogout}
                  className="rounded-xl bg-[#4b0a1c] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/20 transition hover:bg-[#6d102c] active:scale-[0.98]"
                >
                  Yes, logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loan sheets */}
      <LoanDetailsSheet />
      <LoanNotesSheet />
      <LoanFilesSheet />

      {/* Toast messages */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-80 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{
                opacity: 0,
                y: 16,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 8,
                scale: 0.96,
              }}
              className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-[#2a0713]/95 px-4 py-3 text-sm font-medium text-white shadow-[0_18px_55px_rgba(42,7,19,0.30)] ring-1 ring-white/10 backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_22px_65px_rgba(42,7,19,0.38)]"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />

              <span className="flex-1">{toast.message}</span>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusRow({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{
    className?: string;
  }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
      <Icon className="h-4 w-4" />

      <span className="flex-1">{label}</span>

      <CheckCircle2 className="h-4 w-4" />
    </div>
  );
}