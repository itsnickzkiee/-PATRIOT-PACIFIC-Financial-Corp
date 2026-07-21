import {
  useEffect,
  useState,
} from "react";

import LoansTable from "../components/LoansTable";
import type { Loan } from "../data/mock";

const API_URL =
  "http://localhost:5000/api";

export default function FundedLoans() {
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
            "Failed to load funded loans.",
          );
        }

        const data =
          (await response.json()) as Loan[];

        setLoans(
          data.filter(
            (loan) =>
              loan.status ===
              "Loan Funded",
          ),
        );
      } catch (error) {
        console.error(
          "Funded loans error:",
          error,
        );

        setError(
          "Unable to connect to the backend.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadLoans();

    /*
      Refresh once per minute so a newly funded or archived loan
      moves pages without reloading the browser manually.
    */
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
        Loading funded loans...
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
      title="Funded Loans"
      data={loans}
    />
  );
}