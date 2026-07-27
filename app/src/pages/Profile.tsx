import {
  type ComponentType,
  useEffect,
  useState,
} from "react";

import {
  BadgeCheck,
  Building2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/state/AuthContext";

type ProfileData = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  phone: string | null;
  department: string | null;
  company: string | null;
  location: string | null;
  lastActive: string | null;
  dateJoined: string;
};

type ProfileResponse = {
  message?: string;
  user?: ProfileData;
};

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "U";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function formatDate(dateValue: string | null): string {
  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatLastActive(dateValue: string | null): string {
  if (!dateValue) {
    return "Never";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  const difference = Date.now() - date.getTime();
  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) {
    return "Online now";
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function displayRole(role: string): string {
  if (role === "Super Admin") {
    return "System Administrator";
  }

  return role;
}

export default function Profile() {
  const { user } = useAuth();

  const [profile, setProfile] =
    useState<ProfileData | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    async function loadProfile(): Promise<void> {
      if (!user) {
        setErrorMessage(
          "No authenticated user was found.",
        );

        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `${API_URL}/auth/profile/${user.id}`,
        );

        const data =
          (await response.json()) as ProfileResponse;

        if (!response.ok || !data.user) {
          throw new Error(
            data.message ??
              "Unable to load profile.",
          );
        }

        setProfile(data.user);
      } catch (error) {
        console.error(
          "Profile request error:",
          error,
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load profile.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfile();
  }, [user]);

  if (isLoading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-2xl border border-border bg-white shadow-sm">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-rose-100 border-t-rose-700" />

          <p className="mt-4 font-display text-lg font-bold">
            Loading profile...
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Retrieving account information from the database.
          </p>
        </div>
      </div>
    );
  }

  if (!profile || errorMessage) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-display text-lg font-bold text-red-800">
          Unable to load profile
        </h2>

        <p className="mt-2 text-sm text-red-700">
          {errorMessage ||
            "The profile could not be found."}
        </p>
      </div>
    );
  }

  const initials = getInitials(profile.name);

  const role = displayRole(profile.role);

  const department =
    profile.department ||
    "Loans and Commissions";

  const company =
    profile.company ||
    "Patriot Pacific Financial Corp.";

  const phone =
    profile.phone || "Not provided";

  const location =
    profile.location || "Not provided";

  const accountStatus =
    profile.status === "Registered"
      ? "Active"
      : profile.status;

  const dateJoined =
    formatDate(profile.dateJoined);

  const lastActive =
    formatLastActive(profile.lastActive);

  return (
    <div className="space-y-5">
      {/* Professional profile header */}
      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="relative min-h-[210px] overflow-hidden bg-gradient-to-r from-[#350711] via-[#74132f] to-[#ad1e4c] px-6 py-7">
          {/* Decorative background shapes */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[42px] border-white/5" />

            <div className="absolute right-36 top-8 h-28 w-28 rounded-full border-[20px] border-white/5" />

            <div className="absolute bottom-0 left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border-4 border-white/90 bg-white text-2xl font-extrabold text-rose-800 shadow-xl">
                {initials}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
                    {profile.name}
                  </h1>

                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 ring-1 ring-white/30">
                    <BadgeCheck className="h-4 w-4 text-sky-200" />
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-rose-100">
                  {role}
                </p>

                <p className="mt-1 text-sm text-white/75">
                  {department}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-white/10">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  {lastActive}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
                <ShieldCheck className="h-4 w-4" />

                {accountStatus} account
              </span>

              <p className="text-xs text-white/60">
                Administrator profile
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main profile details */}
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-5">
            <h2 className="font-display text-lg font-bold">
              Profile Information
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Personal and work information for this account.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField
              icon={UserRound}
              label="Full Name"
              value={profile.name}
            />

            <ProfileField
              icon={ShieldCheck}
              label="Role"
              value={role}
            />

            <ProfileField
              icon={Mail}
              label="Email Address"
              value={profile.email}
            />

            <ProfileField
              icon={Phone}
              label="Phone Number"
              value={phone}
            />

            <ProfileField
              icon={Building2}
              label="Company"
              value={company}
            />

            <ProfileField
              icon={MapPin}
              label="Location"
              value={location}
            />
          </div>
        </section>

        {/* Account details */}
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="font-display text-lg font-bold">
              Account Details
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current account status and access.
            </p>
          </div>

          <div className="space-y-4">
            <AccountRow
              label="Account status"
              value={accountStatus}
              status
            />

            <AccountRow
              label="Department"
              value={department}
            />

            <AccountRow
              label="Date joined"
              value={dateJoined}
            />

            <AccountRow
              label="Last active"
              value={lastActive}
            />
          </div>
        </section>
      </div>

      {/* Permissions */}
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="font-display text-lg font-bold">
            Access and Permissions
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Features currently available to this administrator.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Permission label="Manage loans" />
          <Permission label="Manage users" />
          <Permission label="View commissions" />
          <Permission label="Access reports" />
        </div>
      </section>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-stone-50/60 p-4 transition hover:border-rose-200 hover:bg-rose-50/30">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-100">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function AccountRow({
  label,
  value,
  status = false,
}: {
  label: string;
  value: string;
  status?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      {status ? (
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
          {value}
        </span>
      ) : (
        <span className="text-right text-sm font-semibold">
          {value}
        </span>
      )}
    </div>
  );
}

function Permission({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 transition hover:border-emerald-200 hover:bg-emerald-50/40">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
        <BadgeCheck className="h-4 w-4" />
      </span>

      <span className="text-sm font-semibold">
        {label}
      </span>
    </div>
  );
}