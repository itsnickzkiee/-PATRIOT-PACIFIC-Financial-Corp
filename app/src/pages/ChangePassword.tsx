import {
  type FormEvent,
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router";

import { useAuth } from "@/state/AuthContext";

import "@/styles/ChangePassword.css";

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

type ChangePasswordResponse = {
  message?: string;
};

export default function ChangePassword() {
  const {
  user,
  isAuthenticated,
  logout,
} = useAuth();

  const navigate = useNavigate();

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const userId = user.id;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setError(
        "Please complete all password fields.",
      );
      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        "New password and confirmation do not match.",
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "New password must contain at least 8 characters.",
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            userId,
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        },
      );

      const data =
        (await response.json()) as
          ChangePasswordResponse;

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to change password.",
        );
      }

      setMessage(
        data.message ??
          "Password changed successfully.",
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

     window.setTimeout(() => {
     logout();

   navigate("/login", {
    replace: true,
    });
   }, 1200);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to change password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="change-password-page">
      <section className="change-password-card">
        <header className="change-password-header">
          <p>PATRIOT PACIFIC</p>
          <h1>Change Password</h1>
          <span>
            Replace your temporary password
            before continuing.
          </span>
        </header>

        <form
          className="change-password-form"
          onSubmit={handleSubmit}
        >
          <label>
            Current Password
            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value,
                )
              }
              autoComplete="current-password"
              placeholder="Enter current password"
              disabled={loading}
            />
          </label>

          <label>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              placeholder="Enter new password"
              disabled={loading}
            />
          </label>

          <label>
            Confirm New Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              placeholder="Confirm new password"
              disabled={loading}
            />
          </label>

          {error && (
            <div
              className="change-password-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className="change-password-success"
              role="status"
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Changing Password..."
              : "Change Password"}
          </button>
        </form>
      </section>
    </main>
  );
}