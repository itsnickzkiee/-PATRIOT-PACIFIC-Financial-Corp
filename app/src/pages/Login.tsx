import {
  type FormEvent,
  type ReactNode,
  useState,
} from "react";

import {
  ArrowRight,
  BarChart3,
  Check,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Landmark,
  LockKeyhole,
  Mail,
  UsersRound,
  X,
  Send,
  CircleCheck,
  LoaderCircle,
} from "lucide-react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router";

import { useAuth } from "@/state/AuthContext";

import { AnimatePresence, motion } from "framer-motion";

type LocationState = {
  from?: string;
};

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [requestingReset, setRequestingReset] = useState(false);
  const [resetRequestSent, setResetRequestSent] = useState(false);
  const [resetError, setResetError] = useState("");


  const { login, isAuthenticated } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const locationState =
    location.state as LocationState | null;

  const destination = locationState?.from || "/";

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function openForgotPasswordDialog(): void {
    setResetEmail(email.trim());
    setResetError("");
    setResetRequestSent(false);
    setForgotPasswordOpen(true);
  }

  function closeForgotPasswordDialog(): void {
    if (requestingReset) {
      return;
    }

    setForgotPasswordOpen(false);
    setResetError("");
    setResetRequestSent(false);
  }

  async function requestPasswordReset(): Promise<void> {
    const cleanEmail = resetEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setResetError("Please enter your company email address.");
      return;
    }

    try {
      setRequestingReset(true);
      setResetError("");

      const response = await fetch(
        `${API_URL}/auth/password-reset-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        },
      );

      const data = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to send the password reset request.",
        );
      }

      setResetRequestSent(true);
    } catch (error) {
      setResetError(
        error instanceof Error
          ? error.message
          : "Unable to send the password reset request.",
      );
    } finally {
      setRequestingReset(false);
    }
  }

  async function handleSubmit(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  setMessage("");
  setMessageType("");

  if (!email.trim()) {
    setMessage(
      "Please enter your email address.",
    );
    setMessageType("error");
    return;
  }

  if (!password) {
    setMessage("Please enter your password.");
    setMessageType("error");
    return;
  }

  setIsLoading(true);

  const result = await login(
    email.trim(),
    password,
    rememberMe,
  );

  if (!result.success) {
    setMessage(result.message);
    setMessageType("error");
    setIsLoading(false);
    return;
  }

  setMessage(
    "Login successful. Opening your workspace...",
  );

  setMessageType("success");

 window.setTimeout(() => {
  navigate(destination, {
    replace: true,
  });
}, 500);

  setIsLoading(false);
}
  return (
    <main className="min-h-screen bg-white">
      <section className="grid min-h-screen lg:grid-cols-[48%_52%]">
        <aside className="relative hidden overflow-hidden bg-[#17060d] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(124,15,46,0.45),transparent_35%),radial-gradient(circle_at_15%_85%,rgba(143,17,52,0.38),transparent_40%),linear-gradient(135deg,#13050b_0%,#300914_52%,#17050c_100%)]" />

          <div className="absolute bottom-0 right-0 h-[70%] w-[65%] opacity-25">
            <div className="absolute bottom-0 right-[12%] h-[62%] w-16 bg-[#6b1029]" />
            <div className="absolute bottom-0 right-[26%] h-[45%] w-20 bg-[#580d22]" />
            <div className="absolute bottom-0 right-[42%] h-[34%] w-14 bg-[#710f2d]" />
            <div className="absolute bottom-0 right-[2%] h-[38%] w-12 bg-[#480a1b]" />
          </div>

          <div className="absolute -right-8 top-0 h-full w-14 rotate-[7deg] bg-[#e0a72f]" />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#490d20] text-[#efb63e]">
                <Landmark size={31} />
              </div>

              <div>
                <p className="text-lg font-bold tracking-[0.08em]">
                  PATRIOT PACIFIC
                </p>

                <p className="mt-1 text-[10px] font-semibold tracking-[0.35em] text-[#e4d3d8]">
                  FINANCIAL CORP
                </p>
              </div>
            </div>

            <div className="mt-24 max-w-lg">
              <h1 className="text-5xl font-bold leading-[1.25] tracking-tight xl:text-6xl">
                Your Pipeline.
                <br />
                Your Performance.
                <br />
                <span className="text-[#e6ad37]">
                  Your Success.
                </span>
              </h1>

              <p className="mt-7 max-w-sm text-lg leading-8 text-[#dfd2d7]">
                Everything you need to grow your loan
                business.
              </p>

              <div className="mt-7 h-1 w-16 rounded-full bg-[#e6ad37]" />
            </div>

            <div className="mt-10 space-y-6">
              <FeatureItem
                icon={<BarChart3 size={22} />}
                label="Real-time Loan Tracking"
              />

              <FeatureItem
                icon={<DollarSign size={22} />}
                label="Commission Management"
              />

              <FeatureItem
                icon={<FileText size={22} />}
                label="Document Organization"
              />

              <FeatureItem
                icon={<UsersRound size={22} />}
                label="User & Access Control"
              />
            </div>
          </div>

          <div className="relative z-10 text-xs text-[#b89ca5]">
            © 2026 Patriot Pacific Financial Corp.
          </div>
        </aside>

        <section className="flex min-h-screen items-center justify-center bg-[#fffdfc] px-5 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-2xl">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5a0d24] text-[#efb63e]">
                <Landmark size={25} />
              </div>

              <div>
                <p className="font-bold tracking-wide text-[#4c0d1d]">
                  PATRIOT PACIFIC
                </p>

                <p className="text-[9px] tracking-[0.25em] text-[#96757f]">
                  FINANCIAL CORP
                </p>
              </div>
            </div>

            

            <div className="text-center">
              <h2 className="text-4xl font-bold text-[#710d25]">
                Welcome back!
              </h2>

              <p className="mt-3 text-base text-[#817277]">
                Sign in using the credentials sent to your
                company email.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-10 space-y-5"
            >
              <InputField
                label="Email Address"
                type="email"
                placeholder="name@patriotpacific.com"
                value={email}
                onChange={setEmail}
                icon={<Mail size={20} />}
                autoComplete="email"
              />

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[#31292c]"
                >
                  Password
                </label>

                <div className="group relative">
                  <LockKeyhole
                    size={20}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8d8588] group-focus-within:text-[#8c1230]"
                  />

                  <input
                    id="password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-[#ded8da] bg-white py-4 pl-14 pr-14 text-base text-[#30282b] outline-none transition placeholder:text-[#a8a0a3] focus:border-[#941532] focus:ring-4 focus:ring-[#941532]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-[#80777a] hover:text-[#7c0d29]"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={21} />
                    ) : (
                      <Eye size={21} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex cursor-pointer items-center gap-3 text-sm text-[#3c3336]">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      rememberMe
                        ? "border-[#991533] bg-[#991533] text-white"
                        : "border-[#cfc5c8] bg-white"
                    }`}
                  >
                    {rememberMe && <Check size={14} />}
                  </span>

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(
                        event.target.checked,
                      )
                    }
                    className="sr-only"
                  />

                  Remember me
                </label>

                <button
                  type="button"
                  onClick={openForgotPasswordDialog}
                  className="text-left text-sm font-medium text-[#8c1230] hover:underline sm:text-right"
                >
                  Forgot password?
                </button>
              </div>

              {message && (
                <div
                  role="alert"
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    messageType === "error"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-4 rounded-xl bg-gradient-to-r from-[#6f0b24] to-[#a51538] px-6 py-4 text-lg font-semibold text-white shadow-[0_12px_25px_rgba(126,13,42,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(126,13,42,0.30)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? "Signing in..."
                  : "Sign In"}

                {!isLoading && (
                  <ArrowRight
                    size={23}
                    className="transition group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            <div className="mt-8 rounded-xl border border-[#eadde1] bg-[#fff8fa] px-5 py-4 text-center text-sm text-[#705d63]">
              Accounts are created by an administrator.
              New users receive their temporary credentials
              through email.
            </div>
          </div>
        </section>
      </section>
      <AnimatePresence>
        {forgotPasswordOpen && (
          <motion.div
            className="fixed inset-0 z-[200] grid place-items-center bg-[#17060d]/55 px-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeForgotPasswordDialog}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="forgot-password-title"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{
                duration: 0.24,
                ease: [0.16, 1, 0.3, 1],
              }}
              onMouseDown={(event) => event.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-[0_30px_100px_rgba(23,6,13,0.38)] backdrop-blur-2xl"
            >
              <button
                type="button"
                onClick={closeForgotPasswordDialog}
                disabled={requestingReset}
                aria-label="Close password reset dialog"
                className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-[#7b6670] shadow-sm transition hover:bg-white hover:text-[#710d25] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>

              {!resetRequestSent ? (
                <>
                  <div className="bg-gradient-to-br from-[#fff7f9] via-white to-[#fffaf2] px-7 pb-6 pt-8">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#710d25] text-[#efb63e] shadow-lg shadow-[#710d25]/20">
                      <LockKeyhole size={25} />
                    </div>

                    <h2
                      id="forgot-password-title"
                      className="mt-5 text-2xl font-bold text-[#4c0d1d]"
                    >
                      Request Password Reset
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#74676c]">
                      Passwords can only be reset by an administrator. Send a
                      request and the admin team will be notified.
                    </p>
                  </div>

                  <div className="px-7 pb-7">
                    <label className="block text-sm font-semibold text-[#31292c]">
                      Company Email
                    </label>

                    <div className="relative mt-2">
                      <Mail
                        size={19}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#96888d]"
                      />

                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(event) => {
                          setResetEmail(event.target.value);
                          setResetError("");
                        }}
                        placeholder="name@patriotpacific.com"
                        autoFocus
                        disabled={requestingReset}
                        className="h-12 w-full rounded-xl border border-[#ded8da] bg-white pl-12 pr-4 text-sm outline-none transition-all duration-300 focus:border-[#941532] focus:ring-4 focus:ring-[#941532]/10 disabled:bg-stone-50"
                      />
                    </div>

                    {resetError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                      >
                        {resetError}
                      </motion.div>
                    )}

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={closeForgotPasswordDialog}
                        disabled={requestingReset}
                        className="flex-1 rounded-xl border border-[#ded8da] bg-white px-4 py-3 text-sm font-semibold text-[#4b3d42] transition hover:bg-[#faf7f8] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => void requestPasswordReset()}
                        disabled={requestingReset}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6f0b24] to-[#a51538] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(126,13,42,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(126,13,42,0.32)] disabled:cursor-not-allowed disabled:opacity-65"
                      >
                        {requestingReset ? (
                          <>
                            <LoaderCircle size={17} className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={17} />
                            Send Request
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="px-8 py-9 text-center">
                  <motion.div
                    initial={{ scale: 0.65, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 240,
                      damping: 18,
                    }}
                    className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50"
                  >
                    <CircleCheck size={40} />
                  </motion.div>

                  <h2 className="mt-6 text-2xl font-bold text-[#26312c]">
                    Request Sent
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#6f7773]">
                    The administrator has been notified. Please wait for the
                    admin to reset your password.
                  </p>

                  <button
                    type="button"
                    onClick={closeForgotPasswordDialog}
                    className="mt-7 w-full rounded-xl bg-[#710d25] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#710d25]/20 transition hover:bg-[#8c1230]"
                  >
                    Okay
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function InputField({
  label,
  type,
  placeholder,
  value,
  onChange,
  icon,
  autoComplete,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  autoComplete?: string;
}) {
  const id = label
    .toLowerCase()
    .replaceAll(" ", "-");

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-[#31292c]"
      >
        {label}
      </label>

      <div className="group relative">
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8d8588] group-focus-within:text-[#8c1230]">
          {icon}
        </span>

        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          required
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-[#ded8da] bg-white py-4 pl-14 pr-5 text-base text-[#30282b] outline-none transition placeholder:text-[#a8a0a3] focus:border-[#941532] focus:ring-4 focus:ring-[#941532]/10"
        />
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c48e25]/70 bg-[#2a0a14] text-[#e6ad37]">
        {icon}
      </div>

      <p className="text-base text-[#f0e5e9]">
        {label}
      </p>
    </div>
  );
}