import { Routes, Route, Navigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import Sidebar from "./components/Navigation/Sidebar";
import BottomNav from "./components/Navigation/BottomNav";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import GymDashboard from "./pages/GymDashboard";
import CoachManagement from "./pages/CoachManagement";
import MemberCRM from "./pages/MemberCRM";
import Calendar from "./pages/Calendar";
import FinancialOverview from "./pages/FinancialOverview";
import AnalyticsReports from "./pages/AnalyticsReports";
import Inbox from "./pages/Inbox";
import GymSettings from "./pages/GymSettings";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat"
      style={{
        backgroundImage: resolvedTheme === "dark"
          ? "url('/gradient-bg-dark.png')"
          : "url('/gradient-bg-light.png')"
      }}
    >
      <Sidebar />
      <main className="md:ml-16 pb-20 md:pb-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
      <BottomNav />
      <Toaster position="top-right" richColors />
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <GymDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coaches"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CoachManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MemberCRM />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Calendar />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financials"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FinancialOverview />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AnalyticsReports />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inbox"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Inbox />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <GymSettings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
