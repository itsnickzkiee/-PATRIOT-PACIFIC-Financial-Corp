import {
  useEffect,
  useState,
} from "react";

import LoansTable from "../components/LoansTable";
import { useAuth } from "@/state/AuthContext";
import type { Loan } from "../data/mock";

const API_URL =
  "http://localhost:5000/api";

export default function ArchivedLoans() {
  const { user } = useAuth();

  const [loans, setLoans] =
    useState<Loan[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadLoans() {
      if (!user?.id) {
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
              "x-user-id": String(
                user.id,
              ),
            },
          },
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to load archived loans.",
          );
        }

        const data = result as Loan[];

        setLoans(
          data.filter(
            (loan) =>
              loan.status === "Closed",
          ),
        );
      } catch (error) {
        console.error(
          "Archived loans error:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load archived loans.",
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
      window.clearInterval(
        intervalId,
      );
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        Loading archived loans...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        {error}
      </div>
    );
  }

  return (
    <LoansTable
      title="Archived Loans"
      data={loans}
    />
  );
}