import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQData {
  question: string;
  answer: string;
}

interface FAQItemProps {
  faq: FAQData;
  isOpen: boolean;
  onClick: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ faq, isOpen, onClick }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      const scrollHeight = contentRef.current.scrollHeight;
      setHeight(isOpen ? scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button
        onClick={onClick}
        className="faq-question"
      >
        <span className="faq-question-text">{faq.question}</span>
        <ChevronDown className={`faq-icon ${isOpen ? 'rotated' : ''}`} />
      </button>
      <div 
        className="faq-answer"
        style={{ height: `${height}px` }}
      >
        <div ref={contentRef} className="faq-answer-content">
          <p>{faq.answer}</p>
        </div>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null); // No item open by default

  const faqs = [
    {
      question: 'How does your resume analyzer work?',
      answer: 'Our AI-powered analyzer uses advanced natural language processing to understand both your resume content and job requirements. It analyzes skills, experience, education, and achievements in context, providing specific recommendations for improvement rather than just keyword matching.'
    },
    {
      question: 'What makes this different from other ATS checkers?',
      answer: 'Unlike traditional ATS checkers that only scan for keywords, our analyzer understands the context and meaning behind job requirements. It provides job-specific analysis, matching your qualifications against actual job descriptions rather than generic templates.'
    },
    {
      question: 'Is my resume data secure and private?',
      answer: 'Absolutely. We take your privacy seriously. Your resume data is processed securely and is not stored permanently on our servers. We use industry-standard encryption and follow strict data protection protocols to ensure your information remains confidential.'
    },
    {
      question: 'What file formats do you support?',
      answer: 'We currently support PDF and DOCX formats for resumes. For job descriptions, you can upload PDF, DOCX, or TXT files, or simply paste the text directly into our analyzer.'
    },
    {
      question: 'How accurate is the analysis?',
      answer: 'Our AI analyzer has a 95% accuracy rate in identifying relevant skills and experience matches. The system is continuously learning and improving based on successful job placements and recruiter feedback.'
    },
    {
      question: 'Can I analyze multiple resumes?',
      answer: 'Yes! You can analyze as many resumes as you need. Each analysis is saved in your dashboard for easy comparison and tracking of improvements over time.'
    },
    {
      question: 'Do I need to create an account?',
      answer: 'No account creation is required for basic analysis. However, creating a free account allows you to save your analysis history, track improvements, and access additional features.'
    },
    {
      question: 'How long does the analysis take?',
      answer: 'Our analysis is lightning-fast! Most resumes are analyzed within 10-15 seconds, providing you with instant feedback and recommendations.'
    }
  ];

  const toggleFAQ = (index: number) => {
    // If clicking on the currently open FAQ, close it
    // Otherwise, open the clicked FAQ (closes any other open FAQ)
    setOpenIndex(prevIndex => prevIndex === index ? null : index);
  };

  return (
    <div className="faq-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Got questions? We've got answers. Learn more about how our resume analyzer works.
          </p>
        </div>

        <div className="faq-container">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onClick={() => toggleFAQ(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ; 