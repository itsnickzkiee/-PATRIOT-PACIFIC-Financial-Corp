import {
  useEffect,
  useState,
} from "react";

import LoansTable from "../components/LoansTable";
import type { Loan } from "../data/mock";

const API_URL =
  "http://localhost:5000/api";

export default function ArchivedLoans() {
  const [loans, setLoans] =
    useState<Loan[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadLoans() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/loans`,
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load archived loans.",
          );
        }

        const data =
          (await response.json()) as Loan[];

        /*
          Archived Loans now uses the Closed status only.
          The old calcCompleted/payrollProcessed condition is removed.
        */
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
          "Unable to load archived loans. Make sure the backend is running.",
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
  }, []);

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