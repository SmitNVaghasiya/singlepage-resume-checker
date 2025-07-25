import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import { HeroSection } from "../components/layout";
import { WhyChooseUs, FAQ } from "../components/ui";
import { ResumeUploadSection } from "../components/file-upload";
import { readFileAsDataURL, validateResumeFile } from "../utils/fileValidation"; // We'll use a utility to convert File to base64
import "../styles/pages/homepage.css";

const HomePage: React.FC = () => {
  const { setResumeFile } = useAppContext();
  const navigate = useNavigate();

  // Handle paste events specifically for the homepage
  React.useEffect(() => {
    const handleHomepagePaste = async (e: ClipboardEvent) => {
      // Check if we're in a text input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return; // Allow default paste behavior for text inputs
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            // Validate file for resume upload (PDF/DOCX only)
            const validation = validateResumeFile(pastedFile);
            if (!validation.isValid) {
              alert(validation.error || "Please upload a PDF or DOCX file");
              return;
            }

            // Set the resume file in context
            setResumeFile(pastedFile);

            // Convert file to base64 and store
            const base64 = await readFileAsDataURL(pastedFile);
            const fileData = {
              name: pastedFile.name,
              type: pastedFile.type,
              size: pastedFile.size,
              base64: base64,
            };
            localStorage.setItem(
              "homepageResumeUpload",
              JSON.stringify(fileData)
            );
            localStorage.setItem("fromHomepageUpload", "true");

            // Navigate using React Router (no page reload)
            navigate("/resumechecker");
            return;
          }
        }
      }
    };

    // Add paste event listener for homepage
    document.addEventListener("paste", handleHomepagePaste);

    return () => {
      document.removeEventListener("paste", handleHomepagePaste);
    };
  }, [navigate, setResumeFile]);

  const handleGetStarted = () => {
    navigate("/resumechecker");
  };

  // Helper to store file in localStorage as base64
  const storeFileForResumeChecker = async (file: File) => {
    const base64 = await readFileAsDataURL(file);
    const fileMeta = {
      name: file.name,
      type: file.type,
      size: file.size,
      base64,
    };
    localStorage.setItem("homepageResumeUpload", JSON.stringify(fileMeta));
    localStorage.setItem("fromHomepageUpload", "true");
  };

  return (
    <div className="homepage-modern">
      <HeroSection onGetStarted={handleGetStarted} />
      <div id="upload-section">
        <ResumeUploadSection
          file={null}
          onFileChange={async (file) => {
            setResumeFile(file);
            if (file) {
              await storeFileForResumeChecker(file);
              navigate("/resumechecker");
            }
          }}
          onContinue={() => {
            navigate("/resumechecker");
          }}
        />
      </div>
      <WhyChooseUs />
      <FAQ />
    </div>
  );
};

export default HomePage;
