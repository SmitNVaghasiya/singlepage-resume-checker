import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { AdminProvider, useAdmin } from "./contexts/AdminContext";
import { Navbar, Footer, MobileNavbar } from "./components/layout";
import { ScrollToTop } from "./components/ui";
import HomePage from "./pages/HomePage";
import ResumeCheckerPage from "./pages/ResumeCheckerPage";
import DashboardPage from "./pages/DashboardPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import AnalysisDetailsPage from "./pages/AnalysisDetailsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import "./styles/globals.css";
import "./styles/components.css";
import "./components/layout/layout.css";
import "./components/layout/navbar.css";
import "./components/layout/footer.css";
import "./styles/pages/pages.css";
import "./components/file-upload/FileUpload.css";
import "./components/analysis/analysis.css";
import "./styles/pages/resume-checker.css";
import "./components/job-description/job-description.css";

// Protected Route Component for Users
const ProtectedUserRoute: React.FC<{ element: React.ReactElement }> = ({
  element,
}) => {
  const { user, isAuthLoading } = useAppContext();
  const { isAuthenticated: isAdminAuthenticated } = useAdmin();

  // If still loading auth state, show loading
  if (isAuthLoading) {
    return (
      <div
        className="loading-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          gap: "1rem",
        }}
      >
        <div
          className="loading-spinner"
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #3498db",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <p>Loading...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If no user is authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Prevent admin from accessing user routes
  if (isAdminAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return element;
};

// Custom hook to detect mobile device
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

// Layout Wrapper Component
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isMobile = useIsMobile();

  if (isAdminRoute) {
    // For admin routes, render without navbar and footer
    return <>{children}</>;
  }

  // For regular routes, render with responsive navbar and footer
  return (
    <>
      {isMobile ? <MobileNavbar /> : <Navbar />}
      {children}
      <Footer />
    </>
  );
};

function App() {
  return (
    <AppProvider>
      <AdminProvider>
        <ScrollToTop />
        <div className="app-container">
          <LayoutWrapper>
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/resumechecker" element={<ResumeCheckerPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* User Routes - Protected from admin access */}
                <Route path="/dashboard" element={<ProtectedUserRoute element={<DashboardPage />} />} />
                <Route
                  path="/dashboard/analysis/:id"
                  element={<ProtectedUserRoute element={<AnalysisDetailsPage />} />}
                />
                <Route
                  path="/profile"
                  element={<ProtectedUserRoute element={<ProfilePage />} />}
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={<AdminDashboardPage />}
                />

                {/* Error Routes */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
          </LayoutWrapper>
        </div>
      </AdminProvider>
    </AppProvider>
  );
}

export default App;
