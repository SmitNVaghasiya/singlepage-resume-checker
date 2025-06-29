import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import HeroSection from '../components/HeroSection';
import WhyChooseUs from '../components/WhyChooseUs';
import FAQ from '../components/FAQ';
import ResumeUploadSection from '../components/ResumeUploadSection';

const HomePage: React.FC = () => {
  const { setResumeFile } = useAppContext();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/resumechecker');
  };

  return (
    <div className="homepage-modern">
      <HeroSection onGetStarted={handleGetStarted} />
      <div id="upload-section">
        <ResumeUploadSection
          file={null}
          onFileChange={(file) => {
            setResumeFile(file);
            if (file) {
              navigate('/resumechecker');
            }
          }}
          onContinue={() => {
            navigate('/resumechecker');
          }}
        />
      </div>
      <WhyChooseUs />
      <FAQ />
    </div>
  );
};

export default HomePage;