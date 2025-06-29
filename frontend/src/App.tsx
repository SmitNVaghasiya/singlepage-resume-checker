import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ResumeCheckerPage from './pages/ResumeCheckerPage';
import DashboardPage from './pages/DashboardPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import './styles/globals.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/navbar.css';
import './styles/footer.css';
import './styles/pages.css';
import './styles/fileupload.css';
import './styles/analysis.css';
import './styles/resume-checker.css';
import './styles/job-description.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/resumechecker" element={<ResumeCheckerPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/contact" element={<ContactPage />} />
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