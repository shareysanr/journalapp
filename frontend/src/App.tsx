import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import GuestRoute from "./components/GuestRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./components/PublicLayout";
import ConfirmSignupPage from "./pages/ConfirmSignupPage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NewEntryPage from "./pages/NewEntryPage";
import EditEntryPage from "./pages/EditEntryPage";
import ViewEntriesPage from "./pages/ViewEntriesPage";
import ReportsPage from "./pages/ReportsPage";
import SignupPage from "./pages/SignupPage";
import ViewReportPage from "./pages/ViewReportPage";

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/confirm" element={<ConfirmSignupPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/entries" element={<ViewEntriesPage />} />
          <Route path="/entries/new" element={<NewEntryPage />} />
          <Route path="/entries/:entryId/edit" element={<EditEntryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/view" element={<ViewReportPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
