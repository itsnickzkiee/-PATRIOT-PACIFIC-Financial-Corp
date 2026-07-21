import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import { WorkspaceProvider } from "./state/workspace";

import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ActiveLoans from "./pages/ActiveLoans";
import FundedLoans from "./pages/FundedLoans";
import ArchivedLoans from "./pages/ArchivedLoans";
import AddLoan from "./pages/AddLoans";
import EditLoan from "./pages/EditLoan";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import KnowledgeBase from "./pages/KnowledgeBase";

export default function App() {
  return (
    <WorkspaceProvider>
      <Routes>
        {/* Public authentication page */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Protected system pages */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/active"
            element={<ActiveLoans />}
          />

          <Route
            path="/funded"
            element={<FundedLoans />}
          />

          <Route
            path="/archived"
            element={<ArchivedLoans />}
          />

          <Route
            path="/loans/new"
            element={<AddLoan />}
          />

          <Route
            path="/loans/:id/edit"
            element={<EditLoan />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/users"
            element={<Users />}
          />

          <Route
            path="/knowledge-base"
            element={<KnowledgeBase />}
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </WorkspaceProvider>
  );
}