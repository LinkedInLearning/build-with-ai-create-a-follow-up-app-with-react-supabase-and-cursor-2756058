import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { SubAdminDashboard } from "@/components/dashboards/ManagerDashboard";
import { AdminOverview } from "@/components/pages/AdminOverview";
import { AdminUsers } from "@/components/pages/AdminUsers";
import { AdminAnalytics } from "@/components/pages/AdminAnalytics";
import { AdminSettings } from "@/components/pages/AdminSettings";
import { ManagerOverview } from "@/components/pages/ManagerOverview";
import { ManagerFollowups } from "@/components/pages/ManagerFollowups";
import { ManagerAnalytics } from "@/components/pages/ManagerAnalytics";
import { ManagerSettings } from "@/components/pages/ManagerSettings";
import { LoginPageWrapper } from "@/components/pages/LoginPage";
import { SignUpPage } from "@/components/SignUpPage";
import { LeadsTable } from "@/components/LeadsTable";
import { LeadForm } from "@/components/LeadForm";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPageWrapper />} />
        <Route
          path="/signup"
          element={
            <SignUpPage
              onSignUp={(user) => {
                // Handle sign-up success - redirect based on role
                if (user.role === "super_admin") {
                  window.location.href = "/admin";
                } else if (user.role === "sub_admin") {
                  window.location.href = "/manager";
                }
              }}
            />
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="leads" element={<LeadsTable />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Manager routes */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute>
              <SubAdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<ManagerOverview />} />
          <Route path="leads" element={<LeadsTable />} />
          <Route path="followups" element={<ManagerFollowups />} />
          <Route path="analytics" element={<ManagerAnalytics />} />
          <Route path="settings" element={<ManagerSettings />} />
        </Route>

        {/* Public lead form */}
        <Route path="/" element={<LeadForm />} />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
