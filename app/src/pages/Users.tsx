import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Search,
  ChevronDown,
  Download,
  UserPlus,
  ShieldCheck,
  MailCheck,
  UserX,
  Lock,
  Bell,
  BellOff,
  Trash2,
  X,
  KeyRound,
  UserRound,
} from "lucide-react";

import { useWorkspace } from "../state/workspace";
import { useAuth } from "@/state/AuthContext";

import {
  avatarPalette,
  initialsOf,
} from "../data/mock";

type Tab =
  | "Registered"
  | "Pending"
  | "Deactivated";

type UserRole =
  | "Super Admin"
  | "Admin"
  | "Loan Officer"
  | "Processor"
  | "Accounting";

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: Tab;
  dateAdded: string;
  lastActive: string;
  online: boolean;
  notificationsEnabled: boolean;
};

type UsersResponse = {
  users?: Array<{
    id: number;
    name: string;
    email: string;
    role: UserRole;
    status: Tab;
    dateAdded: string | null;
    lastActive: string | null;
    notificationsEnabled: boolean;
  }>;

  message?: string;
};

type CreateUserResponse = {
  message?: string;
  temporaryPassword?: string;

  user?: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    status: Tab;
    dateAdded: string;
    lastActive: string;
    online: boolean;
  };
};

type UpdateUserResponse = {
  message?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    status: Tab;
    dateAdded: string | null;
    lastActive: string | null;
  };
};

type ResetPasswordResponse = {
  message?: string;
};

type NotificationToggleResponse = {
  message?: string;
  notificationsEnabled?: boolean;
};

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

const TABS: {
  key: Tab;
  icon: React.ElementType;
}[] = [
    {
      key: "Registered",
      icon: ShieldCheck,
    },
    {
      key: "Pending",
      icon: MailCheck,
    },
    {
      key: "Deactivated",
      icon: UserX,
    },
  ];

const ROLES = [
  "All roles",
  "Admin",
  "Loan Officer",
  "Processor",
  "Accounting",
];

function formatDate(
  dateValue: string | null,
): string {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

function formatLastActive(
  dateValue: string | null,
): string {
  if (!dateValue) {
    return "Never";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  const difference =
    Date.now() - date.getTime();

  const minutes = Math.floor(
    difference / 60000,
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"
      } ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"
      } ago`;
  }

  const days = Math.floor(
    hours / 24,
  );

  return `${days} day${days === 1 ? "" : "s"
    } ago`;
}

export default function Users() {
  const { pushToast } = useWorkspace();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<
    UserRecord[]
  >([]);

  const [tab, setTab] =
    useState<Tab>("Registered");

  const [query, setQuery] =
    useState("");

  const [role, setRole] =
    useState("All roles");

  const [selected, setSelected] =
    useState<Set<number>>(
      new Set(),
    );

  const [addOpen, setAddOpen] =
    useState(false);

  const [isLoadingUsers, setIsLoadingUsers] =
    useState(true);

  const [isCreating, setIsCreating] =
    useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Loan Officer",
  });

  const [editOpen, setEditOpen] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState<UserRecord | null>(null);

  const [editForm, setEditForm] =
    useState<{
      name: string;
      email: string;
      role: UserRole;
    }>({
      name: "",
      email: "",
      role: "Loan Officer",
    });

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [resettingUserId, setResettingUserId] =
    useState<number | null>(null);

  const [
    togglingNotificationUserId,
    setTogglingNotificationUserId,
  ] = useState<number | null>(null);

  async function loadUsers(): Promise<void> {
    try {
      setIsLoadingUsers(true);

      if (!currentUser?.id) {
        setUsers([]);
        pushToast("A logged-in admin user is required.");
        return;
      }

      const response = await fetch(
        `${API_URL}/users`,
        {
          headers: {
            "x-user-id": String(currentUser.id),
          },
        },
      );

      const data =
        (await response.json()) as UsersResponse;

      if (!response.ok) {
        throw new Error(
          data.message ??
          "Unable to load users.",
        );
      }

      const databaseUsers =
        data.users ?? [];

      const formattedUsers: UserRecord[] =
        databaseUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          dateAdded: formatDate(
            user.dateAdded,
          ),
          lastActive:
            formatLastActive(
              user.lastActive,
            ),
          online:
            formatLastActive(
              user.lastActive,
            ) === "Just now",
          notificationsEnabled:
            user.notificationsEnabled !== false,
        }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error(
        "Load users error:",
        error,
      );

      pushToast(
        "Cannot load users from the database.",
      );
    } finally {
      setIsLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (currentUser?.id) {
      void loadUsers();
    } else {
      setIsLoadingUsers(false);
    }
  }, [currentUser?.id]);

  const counts = useMemo(
    () => ({
      Registered: users.filter(
        (user) =>
          user.status ===
          "Registered",
      ).length,

      Pending: users.filter(
        (user) =>
          user.status === "Pending",
      ).length,

      Deactivated: users.filter(
        (user) =>
          user.status ===
          "Deactivated",
      ).length,
    }),
    [users],
  );

  const filtered = users.filter(
    (user) => {
      const search =
        query.toLowerCase();

      return (
        user.status === tab &&
        (role === "All roles" ||
          user.role === role) &&
        (!search ||
          user.name
            .toLowerCase()
            .includes(search) ||
          user.email
            .toLowerCase()
            .includes(search))
      );
    },
  );

  const toggle = (id: number) => {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const exportCsv = () => {
    const body = filtered
      .map(
        (user) =>
          `"${user.name}",${user.email},${user.role},${user.status},"${user.dateAdded}","${user.lastActive}"`,
      )
      .join("\n");

    const csvContent =
      `Name,Email,Role,Status,Date Added,Last Active\n${body}`;

    const url =
      URL.createObjectURL(
        new Blob([csvContent], {
          type: "text/csv",
        }),
      );

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      "users-export.csv";

    anchor.click();

    URL.revokeObjectURL(url);

    pushToast(
      `Exported ${filtered.length} users`,
    );
  };

  const submitAdd = async () => {
    const name = form.name.trim();

    const email = form.email
      .trim()
      .toLowerCase();

    if (!name || !email) {
      pushToast(
        "Full name and email are required.",
      );

      return;
    }

    try {
      setIsCreating(true);

      const response = await fetch(
        `${API_URL}/users`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            "x-user-id": String(currentUser?.id ?? ""),
          },

          body: JSON.stringify({
            name,
            email,
            role: form.role,
          }),
        },
      );

      const data =
        (await response.json()) as CreateUserResponse;

      if (
        !response.ok ||
        !data.user
      ) {
        pushToast(
          data.message ??
          "Unable to create user.",
        );

        return;
      }

      setAddOpen(false);

      setForm({
        name: "",
        email: "",
        role: "Loan Officer",
      });

      setTab("Registered");

      await loadUsers();

      if (data.temporaryPassword) {
        pushToast(
          `Account created. Temporary password: ${data.temporaryPassword}`,
        );
      } else {
        pushToast(
          "User account created successfully.",
        );
      }
    } catch (error) {
      console.error(
        "Create user error:",
        error,
      );

      pushToast(
        "Cannot connect to the backend server.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const closeEditModal = () => {
    if (isUpdating) {
      return;
    }

    setEditOpen(false);
    setEditingUser(null);
  };

  const submitEdit = async () => {
    if (!editingUser) {
      return;
    }

    const name = editForm.name.trim();
    const email = editForm.email
      .trim()
      .toLowerCase();

    if (!name || !email) {
      pushToast(
        "Full name and email are required.",
      );
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      pushToast(
        "Please enter a valid email address.",
      );
      return;
    }

    const hasChanges =
      name !== editingUser.name ||
      email !== editingUser.email.toLowerCase() ||
      editForm.role !== editingUser.role;

    if (!hasChanges) {
      pushToast("No profile changes to save.");
      return;
    }

    try {
      setIsUpdating(true);

      const response = await fetch(
        `${API_URL}/users/${editingUser.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": String(currentUser?.id ?? ""),
          },
          body: JSON.stringify({
            name,
            email,
            role: editForm.role,
          }),
        },
      );

      const data =
        (await response.json()) as UpdateUserResponse;

      if (!response.ok || !data.user) {
        pushToast(
          data.message ?? "Unable to update user.",
        );
        return;
      }

      await loadUsers();
      setEditOpen(false);
      setEditingUser(null);
      pushToast(
        data.message ??
          "User profile updated successfully.",
      );
    } catch (error) {
      console.error("Update user error:", error);
      pushToast(
        "Cannot connect to the backend server.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const resetUserPassword = async (
    user: UserRecord,
  ) => {
    const confirmed = window.confirm(
      `Reset ${user.name}'s password and send a new temporary password to ${user.email}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setResettingUserId(user.id);

      const response = await fetch(
        `${API_URL}/users/${user.id}/reset-password`,
        {
          method: "POST",
          headers: {
            "x-user-id": String(currentUser?.id ?? ""),
          },
        },
      );

      const data =
        (await response.json()) as ResetPasswordResponse;

      if (!response.ok) {
        pushToast(
          data.message ??
            "Unable to reset the password.",
        );

        return;
      }

      pushToast(
        data.message ??
          "Temporary password sent successfully.",
      );
    } catch (error) {
      console.error(
        "Reset password error:",
        error,
      );

      pushToast(
        "Cannot connect to the backend server.",
      );
    } finally {
      setResettingUserId(null);
    }
  };

  const toggleUserNotifications = async (
    user: UserRecord,
  ) => {
    const nextEnabled =
      !user.notificationsEnabled;

    try {
      setTogglingNotificationUserId(
        user.id,
      );

      const response = await fetch(
        `${API_URL}/users/${user.id}/notifications`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
            "x-user-id": String(currentUser?.id ?? ""),
          },

          body: JSON.stringify({
            enabled: nextEnabled,
          }),
        },
      );

      const data =
        (await response.json()) as NotificationToggleResponse;

      if (!response.ok) {
        pushToast(
          data.message ??
            "Unable to update notification settings.",
        );

        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                notificationsEnabled:
                  data.notificationsEnabled ??
                  nextEnabled,
              }
            : currentUser,
        ),
      );

      pushToast(
        data.message ??
          `Notifications ${
            nextEnabled
              ? "enabled"
              : "disabled"
          } for ${user.name}.`,
      );
    } catch (error) {
      console.error(
        "Toggle notifications error:",
        error,
      );

      pushToast(
        "Cannot connect to the backend server.",
      );
    } finally {
      setTogglingNotificationUserId(
        null,
      );
    }
  };

  const setUserStatus = (
    id: number,
    status: Tab,
  ) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === id
          ? {
            ...user,
            status,
          }
          : user,
      ),
    );
  };

  const deleteUser = (
    id: number,
  ) => {
    setUsers((currentUsers) =>
      currentUsers.filter(
        (user) => user.id !== id,
      ),
    );
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
      }}
      className="card-shadow overflow-hidden rounded-2xl border border-border bg-card"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-white/60 px-5 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
            placeholder="Search users…"
            className="h-9 w-60 rounded-full border border-input bg-white pl-9 pr-4 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
          />
        </div>

        {/* Status tabs */}
        <div className="flex rounded-full border border-input bg-white p-1">
          {TABS.map(
            ({
              key,
              icon: Icon,
            }) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key);

                  setSelected(
                    new Set(),
                  );
                }}
                className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${tab === key
                  ? "bg-rose-700 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />

                {key}

                <span
                  className={`rounded-full px-1.5 text-[10px] ${tab === key
                    ? "bg-white/20"
                    : "bg-muted"
                    }`}
                >
                  {counts[key]}
                </span>
              </button>
            ),
          )}
        </div>

        <div className="relative">
          <select
            value={role}
            onChange={(event) =>
              setRole(
                event.target.value,
              )
            }
            className="h-9 appearance-none rounded-full border border-input bg-white pl-4 pr-9 text-sm font-medium outline-none focus:border-rose-400"
          >
            {ROLES.map(
              (roleOption) => (
                <option
                  key={roleOption}
                >
                  {roleOption}
                </option>
              ),
            )}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <button
          onClick={() => {
            setQuery("");
            setRole("All roles");
          }}
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Clear
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-full border border-input bg-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition hover:border-rose-300 hover:text-rose-700"
          >
            <Download className="h-3.5 w-3.5" />

            Export
          </button>

          <button
            onClick={() =>
              setAddOpen(true)
            }
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-700 to-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-700/25 transition hover:brightness-110 active:scale-95"
          >
            <UserPlus className="h-3.5 w-3.5" />

            Create User
          </button>
        </div>
      </div>

      {/* Bulk bar */}
      <AnimatePresence>
        {selected.size > 0 && (
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
            className="flex items-center gap-3 overflow-hidden border-b border-rose-100 bg-rose-50/70 px-5"
          >
            <div className="flex items-center gap-3 py-2.5 text-sm">
              <span className="font-bold text-rose-800">
                {selected.size}{" "}
                selected
              </span>

              <button
                onClick={() => {
                  selected.forEach(
                    (id) =>
                      setUserStatus(
                        id,
                        "Deactivated",
                      ),
                  );

                  const selectedCount =
                    selected.size;

                  setSelected(
                    new Set(),
                  );

                  pushToast(
                    `${selectedCount} user(s) deactivated`,
                  );
                }}
                className="text-xs font-bold text-rose-700 hover:underline"
              >
                Deactivate
              </button>

              <button
                onClick={() => {
                  selected.forEach(
                    (id) =>
                      deleteUser(id),
                  );

                  const selectedCount =
                    selected.size;

                  setSelected(
                    new Set(),
                  );

                  pushToast(
                    `${selectedCount} user(s) removed`,
                  );
                }}
                className="text-xs font-bold text-rose-700 hover:underline"
              >
                Delete
              </button>

              <button
                onClick={() =>
                  setSelected(
                    new Set(),
                  )
                }
                className="text-xs font-semibold text-muted-foreground hover:underline"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-border bg-stone-50/70 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              <th className="w-10 px-5 py-3">
                <input
                  type="checkbox"
                  checked={
                    filtered.length >
                    0 &&
                    filtered.every(
                      (user) =>
                        selected.has(
                          user.id,
                        ),
                    )
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelected(
                      event.target
                        .checked
                        ? new Set(
                          filtered.map(
                            (
                              user,
                            ) =>
                              user.id,
                          ),
                        )
                        : new Set(),
                    )
                  }
                  className="h-4 w-4 accent-rose-700"
                />
              </th>

              <th className="px-3 py-3">
                User
              </th>

              <th className="px-3 py-3">
                Email
              </th>

              <th className="px-3 py-3">
                Role
              </th>

              <th className="px-3 py-3">
                Date Added
              </th>

              <th className="px-3 py-3">
                Last Active
              </th>

              <th className="px-5 py-3 text-center">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            <AnimatePresence
              initial={false}
            >
              {filtered.map(
                (user) => (
                  <motion.tr
                    key={user.id}
                    layout
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    className={`row-hover border-b border-border/70 last:border-0 ${selected.has(
                      user.id,
                    )
                      ? "bg-rose-50/50"
                      : ""
                      }`}
                  >
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(
                          user.id,
                        )}
                        onChange={() =>
                          toggle(
                            user.id,
                          )
                        }
                        className="h-4 w-4 accent-rose-700"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${avatarPalette(
                              user.name,
                            )}`}
                          >
                            {initialsOf(
                              user.name,
                            )}
                          </div>

                          {user.online && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                          )}
                        </div>

                        <span className="text-sm font-bold">
                          {user.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-sm text-muted-foreground">
                      {user.email}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${user.role ===
                          "Admin"
                          ? "bg-violet-50 text-violet-700 ring-violet-100"
                          : user.role ===
                            "Processor"
                            ? "bg-sky-50 text-sky-700 ring-sky-100"
                            : user.role ===
                              "Accounting"
                              ? "bg-amber-50 text-amber-700 ring-amber-100"
                              : user.role ===
                                "Super Admin"
                                ? "bg-rose-50 text-rose-700 ring-rose-100"
                                : "bg-stone-100 text-stone-600 ring-stone-200"
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-sm tabular-nums text-foreground/90">
                      {
                        user.dateAdded
                      }
                    </td>

                    <td className="px-3 py-3">
                      {user.lastActive ===
                        "Just now" ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                          <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />

                          Just now
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          ●{" "}
                          {
                            user.lastActive
                          }
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-0.5">
                        <ActionBtn
                          title="Edit Profile"
                          onClick={() => {
                            setEditingUser(user);
                            setEditForm({
                              name: user.name,
                              email: user.email,
                              role: user.role,
                            });
                            setEditOpen(true);
                          }}
                        >
                          <UserRound className="h-4 w-4 text-sky-600" />
                        </ActionBtn>

                        <ActionBtn
                          title={
                            user.notificationsEnabled
                              ? "Disable notifications"
                              : "Enable notifications"
                          }
                          onClick={() =>
                            void toggleUserNotifications(
                              user,
                            )
                          }
                          disabled={
                            togglingNotificationUserId ===
                            user.id
                          }
                        >
                          {user.notificationsEnabled ? (
                            <Bell className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <BellOff className="h-4 w-4 text-rose-500" />
                          )}
                        </ActionBtn>

                        {user.status ===
                          "Deactivated" ? (
                          <ActionBtn
                            title="Reactivate"
                            onClick={() => {
                              setUserStatus(
                                user.id,
                                "Registered",
                              );

                              pushToast(
                                `${user.name} reactivated`,
                              );
                            }}
                          >
                            <Lock className="h-4 w-4 text-emerald-600" />
                          </ActionBtn>
                        ) : (
                          <ActionBtn
                            title="Deactivate"
                            onClick={() => {
                              setUserStatus(
                                user.id,
                                "Deactivated",
                              );

                              pushToast(
                                `${user.name} deactivated`,
                              );
                            }}
                          >
                            <Lock className="h-4 w-4" />
                          </ActionBtn>
                        )}

                        <ActionBtn
                          title={
                            resettingUserId === user.id
                              ? "Sending temporary password..."
                              : "Reset Password"
                          }
                          onClick={() =>
                            void resetUserPassword(
                              user,
                            )
                          }
                          disabled={
                            resettingUserId ===
                            user.id
                          }
                        >
                          <KeyRound className="h-4 w-4 text-violet-600" />
                        </ActionBtn>

                        <ActionBtn
                          title="Delete"
                          onClick={() => {
                            deleteUser(
                              user.id,
                            );

                            pushToast(
                              `${user.name} removed`,
                            );
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </ActionBtn>
                      </div>
                    </td>
                  </motion.tr>
                ),
              )}
            </AnimatePresence>

            {isLoadingUsers && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-16 text-center"
                >
                  <p className="font-display text-lg font-bold">
                    Loading users...
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Retrieving accounts
                    from the database.
                  </p>
                </td>
              </tr>
            )}

            {!isLoadingUsers &&
              filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >
                    <p className="font-display text-lg font-bold">
                      No{" "}
                      {tab.toLowerCase()}{" "}
                      users
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Try another tab or
                      adjust your filters.
                    </p>
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border bg-white/60 px-5 py-3.5 text-xs text-muted-foreground">
        Showing {filtered.length}{" "}
        {tab.toLowerCase()} user
        {filtered.length === 1
          ? ""
          : "s"}{" "}
        · {users.length} total
      </div>

      {/* Add User modal */}
      <AnimatePresence>
        {addOpen && (
          <>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="pointer-events-none fixed inset-0 z-40 bg-[#1c050d]/55 backdrop-blur-sm"
            />

            <div className="pointer-events-none fixed inset-0 z-40 grid place-items-center p-4">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.96,
                }}
                transition={{
                  duration: 0.2,
                  ease: "easeOut",
                }}
                className="pointer-events-auto card-shadow-lg max-h-[85vh] w-[min(480px,92vw)] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold">
                      Create User
                      Account
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      A temporary password
                      will be generated and
                      sent to their company
                      email.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setAddOpen(false)
                    }
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                  Admin access only. Choose
                  the correct role before
                  creating the account.
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Full name
                    </span>

                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          name: event
                            .target.value,
                        })
                      }
                      placeholder="e.g. Jordan Lee"
                      className="h-10 w-full rounded-xl border border-input bg-stone-50/60 px-3 text-sm outline-none focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Email
                    </span>

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          email:
                            event.target
                              .value,
                        })
                      }
                      placeholder="name@patriotpacific.com"
                      className="h-10 w-full rounded-xl border border-input bg-stone-50/60 px-3 text-sm outline-none focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Role
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Loan Officer",
                        "Admin",
                        "Processor",
                        "Accounting",
                      ].map(
                        (roleOption) => (
                          <button
                            type="button"
                            key={
                              roleOption
                            }
                            onClick={() =>
                              setForm({
                                ...form,
                                role: roleOption,
                              })
                            }
                            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${form.role ===
                              roleOption
                              ? "border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20"
                              : "border-input bg-white text-muted-foreground hover:border-stone-300"
                              }`}
                          >
                            {
                              roleOption
                            }
                          </button>
                        ),
                      )}
                    </div>
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAddOpen(false)
                    }
                    disabled={isCreating}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void submitAdd()
                    }
                    disabled={
                      !form.name.trim() ||
                      !form.email.trim() ||
                      isCreating
                    }
                    className="rounded-full bg-gradient-to-r from-rose-700 to-rose-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-rose-700/25 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isCreating
                      ? "Creating..."
                      : "Create User"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit User modal */}
      <AnimatePresence>
        {editOpen && editingUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditModal}
              className="fixed inset-0 z-40 bg-[#1c050d]/55 backdrop-blur-sm"
            />

            <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="pointer-events-auto card-shadow-lg max-h-[90vh] w-[min(520px,94vw)] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold ${avatarPalette(
                        editingUser.name,
                      )}`}
                    >
                      {initialsOf(editingUser.name)}
                    </div>

                    <div>
                      <h3 className="font-display text-lg font-bold">
                        Edit User Profile
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Update the user's name, email address, or role.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={isUpdating}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-border bg-stone-50/70 p-4 text-xs">
                  <div>
                    <p className="font-bold uppercase tracking-wider text-muted-foreground">User ID</p>
                    <p className="mt-1 font-semibold text-foreground">#{editingUser.id}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wider text-muted-foreground">Status</p>
                    <p className="mt-1 font-semibold text-foreground">{editingUser.status}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wider text-muted-foreground">Date Added</p>
                    <p className="mt-1 font-semibold text-foreground">{editingUser.dateAdded}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wider text-muted-foreground">Last Active</p>
                    <p className="mt-1 font-semibold text-foreground">{editingUser.lastActive}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Full name
                    </span>
                    <input
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm({ ...editForm, name: event.target.value })
                      }
                      placeholder="Enter full name"
                      disabled={isUpdating}
                      className="h-10 w-full rounded-xl border border-input bg-stone-50/60 px-3 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Email address
                    </span>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(event) =>
                        setEditForm({ ...editForm, email: event.target.value })
                      }
                      placeholder="name@patriotpacific.com"
                      disabled={isUpdating}
                      className="h-10 w-full rounded-xl border border-input bg-stone-50/60 px-3 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <div>
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Role
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {["Loan Officer", "Admin", "Processor", "Accounting"].map(
                        (roleOption) => (
                          <button
                            type="button"
                            key={roleOption}
                            onClick={() =>
                              setEditForm({
                                ...editForm,
                                role: roleOption as UserRole,
                              })
                            }
                            disabled={isUpdating}
                            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              editForm.role === roleOption
                                ? "border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20"
                                : "border-input bg-white text-muted-foreground hover:border-stone-300"
                            }`}
                          >
                            {roleOption}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={isUpdating}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => void submitEdit()}
                    disabled={
                      !editForm.name.trim() ||
                      !editForm.email.trim() ||
                      isUpdating
                    }
                    className="rounded-full bg-gradient-to-r from-rose-700 to-rose-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-rose-700/25 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ActionBtn({
  children,
  title,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}