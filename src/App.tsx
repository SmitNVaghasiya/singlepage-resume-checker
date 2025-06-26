import { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ContactPage from './pages/ContactPage';
import { AnalysisResult } from './types';

type PageType = 'home' | 'contact' | 'dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);

  const addAnalysisToHistory = (analysis: AnalysisResult) => {
    setCurrentAnalysis(analysis);
    setAnalysisHistory(prev => [analysis, ...prev]);
  };

  const resetAnalysis = () => {
    setCurrentAnalysis(null);
    setCurrentPage('home');
  };

  const navigateToPage = (page: PageType) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Navbar 
        currentPage={currentPage}
        onNavigate={navigateToPage}
        onReset={resetAnalysis}
        hasAnalysis={!!currentAnalysis}
      />
      
      {currentPage === 'home' && (
        <HomePage 
          onAnalysisComplete={addAnalysisToHistory}
          onNavigateToDashboard={() => setCurrentPage('dashboard')}
        />
      )}
      
      {currentPage === 'dashboard' && (
        <DashboardPage 
          analysisResult={currentAnalysis}
          analysisHistory={analysisHistory}
          onNewAnalysis={() => setCurrentPage('home')}
        />
      )}
      
      {currentPage === 'contact' && (
        <ContactPage />
      )}
      
      <Footer onNavigateToContact={() => setCurrentPage('contact')} />
    </div>
  );
}

export default App;