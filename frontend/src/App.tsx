import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { Navbar, Footer } from "./components/layout";
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
import "./components/dashboard/DashboardAnalysisResults.css";

function App() {
  return (
    <AppProvider>
      <Router>
        <ScrollToTop />
        <div className="app-container">
          <Navbar />

          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/resumechecker" element={<ResumeCheckerPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/dashboard/analysis/:id"
                element={<AnalysisDetailsPage />}
              />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
