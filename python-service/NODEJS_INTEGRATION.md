# Node.js Backend Integration Guide

This guide explains how to integrate the comprehensive AI analysis functionality with your Node.js backend.

## Overview

The Python service now provides two endpoints:

- **`POST /analyze-resume`** - New comprehensive analysis (recommended)
- **`POST /analyze`** - Legacy analysis (backward compatibility)

## Endpoint Details

### Comprehensive Analysis Endpoint

**URL:** `POST http://localhost:8000/analyze-resume`

**Headers:**

```javascript
Content-Type: multipart/form-data
```

**Form Data:**

- `resume_file` (required): Resume file (PDF, DOCX, TXT)
- `job_description_file` (optional): Job description file
- `job_description_text` (optional): Job description as text

_Note: Either `job_description_file` OR `job_description_text` must be provided_

## Node.js Implementation

### 1. Update pythonApiService.ts

```typescript
// backend/src/services/pythonApiService.ts

export interface ComprehensiveAnalysisResponse {
  analysis_id: string;
  timestamp: string;
  job_description_validity: string;
  resume_eligibility: string;
  score_out_of_100: number;
  short_conclusion: string;
  chance_of_selection_percentage: number;
  resume_improvement_priority: string[];
  overall_fit_summary: string;
  resume_analysis_report: {
    candidate_information: {
      name: string;
      position_applied: string;
      experience_level: string;
      current_status: string;
    };
    strengths_analysis: {
      technical_skills: string[];
      project_portfolio: string[];
      educational_background: string[];
    };
    weaknesses_analysis: {
      critical_gaps_against_job_description: string[];
      technical_deficiencies: string[];
      resume_presentation_issues: string[];
      soft_skills_gaps: string[];
      missing_essential_elements: string[];
    };
    section_wise_detailed_feedback: {
      contact_information: SectionFeedback;
      profile_summary: SectionFeedback;
      education: SectionFeedback;
      skills: SectionFeedback;
      projects: SectionFeedback;
      missing_sections: {
        certifications: string;
        experience: string;
        achievements: string;
        soft_skills: string;
      };
    };
    improvement_recommendations: {
      immediate_resume_additions: string[];
      immediate_priority_actions: string[];
      short_term_development_goals: string[];
      medium_term_objectives: string[];
    };
    soft_skills_enhancement_suggestions: {
      communication_skills: string[];
      teamwork_and_collaboration: string[];
      leadership_and_initiative: string[];
      problem_solving_approach: string[];
    };
    final_assessment: {
      eligibility_status: string;
      hiring_recommendation: string;
      key_interview_areas: string[];
      onboarding_requirements: string[];
      long_term_potential: string;
    };
  };
}

interface SectionFeedback {
  current_state: string;
  strengths: string[];
  improvements: string[];
}

export class PythonApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.PYTHON_API_URL || "http://localhost:8000";
  }

  // New comprehensive analysis method
  async analyzeResumeComprehensive(
    resumeFile: Express.Multer.File,
    jobDescriptionText?: string,
    jobDescriptionFile?: Express.Multer.File
  ): Promise<ComprehensiveAnalysisResponse> {
    try {
      const formData = new FormData();

      // Add resume file
      formData.append(
        "resume_file",
        new Blob([resumeFile.buffer]),
        resumeFile.originalname
      );

      // Add job description (either text or file)
      if (jobDescriptionText) {
        formData.append("job_description_text", jobDescriptionText);
      } else if (jobDescriptionFile) {
        formData.append(
          "job_description_file",
          new Blob([jobDescriptionFile.buffer]),
          jobDescriptionFile.originalname
        );
      } else {
        throw new Error("Either job description text or file must be provided");
      }

      const response = await fetch(`${this.baseURL}/analyze-resume`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Analysis failed: ${errorData.message || response.statusText}`
        );
      }

      const result = await response.json();
      return result as ComprehensiveAnalysisResponse;
    } catch (error) {
      console.error("Comprehensive analysis error:", error);
      throw error;
    }
  }

  // Legacy analysis method (keep for backward compatibility)
  async analyzeResume(
    resumeFile: Express.Multer.File,
    jobDescriptionText?: string,
    jobDescriptionFile?: Express.Multer.File
  ): Promise<AnalysisResponse> {
    // ... existing implementation
  }
}
```

### 2. Update Resume Controller

```typescript
// backend/src/controllers/resumeController.ts

export const analyzeResumeComprehensive = async (
  req: Request,
  res: Response
) => {
  try {
    const resumeFile = req.files?.["resume"]?.[0];
    const jobDescriptionFile = req.files?.["jobDescription"]?.[0];
    const { jobDescriptionText } = req.body;

    if (!resumeFile) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required",
      });
    }

    if (!jobDescriptionText && !jobDescriptionFile) {
      return res.status(400).json({
        success: false,
        message: "Either job description text or file must be provided",
      });
    }

    // Call comprehensive analysis
    const analysisResult = await pythonApiService.analyzeResumeComprehensive(
      resumeFile,
      jobDescriptionText,
      jobDescriptionFile
    );

    // Save to database (optional - already saved by Python service)
    // You can store additional metadata or user associations here

    res.json({
      success: true,
      data: analysisResult,
      message: "Comprehensive analysis completed successfully",
    });
  } catch (error) {
    console.error("Comprehensive analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Analysis failed",
      error: error.message,
    });
  }
};
```

### 3. Update Routes

```typescript
// backend/src/routes/resumeRoutes.ts

import { analyzeResumeComprehensive } from "../controllers/resumeController";

// Add new comprehensive analysis route
router.post(
  "/analyze-comprehensive",
  auth,
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "jobDescription", maxCount: 1 },
  ]),
  analyzeResumeComprehensive
);

// Keep existing route for backward compatibility
router.post(
  "/analyze",
  auth,
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "jobDescription", maxCount: 1 },
  ]),
  analyzeResume
);
```

## Frontend Integration

### API Call Example

```typescript
// frontend/src/services/api.ts

export const analyzeResumeComprehensive = async (
  resumeFile: File,
  jobDescriptionText?: string,
  jobDescriptionFile?: File
): Promise<ComprehensiveAnalysisResponse> => {
  const formData = new FormData();
  formData.append("resume", resumeFile);

  if (jobDescriptionText) {
    formData.append("jobDescriptionText", jobDescriptionText);
  } else if (jobDescriptionFile) {
    formData.append("jobDescription", jobDescriptionFile);
  }

  const response = await fetch("/api/resume/analyze-comprehensive", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Analysis failed");
  }

  return response.json();
};
```

### React Component Example

```tsx
// frontend/src/components/ComprehensiveAnalysis.tsx

import React, { useState } from "react";
import { analyzeResumeComprehensive } from "../services/api";

export const ComprehensiveAnalysisComponent: React.FC = () => {
  const [analysisResult, setAnalysisResult] =
    useState<ComprehensiveAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalysis = async (
    resumeFile: File,
    jobDescriptionText: string
  ) => {
    setLoading(true);
    try {
      const result = await analyzeResumeComprehensive(
        resumeFile,
        jobDescriptionText
      );
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysisReport = () => {
    if (!analysisResult) return null;

    const { resume_analysis_report } = analysisResult;

    return (
      <div className="analysis-results">
        <div className="summary">
          <h2>Analysis Summary</h2>
          <p>
            <strong>Score:</strong> {analysisResult.score_out_of_100}/100
          </p>
          <p>
            <strong>Eligibility:</strong> {analysisResult.resume_eligibility}
          </p>
          <p>
            <strong>Selection Chance:</strong>{" "}
            {analysisResult.chance_of_selection_percentage}%
          </p>
          <p>{analysisResult.short_conclusion}</p>
        </div>

        <div className="candidate-info">
          <h3>Candidate Information</h3>
          <p>
            <strong>Name:</strong>{" "}
            {resume_analysis_report.candidate_information.name}
          </p>
          <p>
            <strong>Position:</strong>{" "}
            {resume_analysis_report.candidate_information.position_applied}
          </p>
          <p>
            <strong>Experience Level:</strong>{" "}
            {resume_analysis_report.candidate_information.experience_level}
          </p>
        </div>

        <div className="strengths">
          <h3>Technical Skills</h3>
          <ul>
            {resume_analysis_report.strengths_analysis.technical_skills.map(
              (skill, index) => (
                <li key={index}>{skill}</li>
              )
            )}
          </ul>
        </div>

        <div className="improvements">
          <h3>Priority Improvements</h3>
          <ul>
            {analysisResult.resume_improvement_priority.map(
              (improvement, index) => (
                <li key={index}>{improvement}</li>
              )
            )}
          </ul>
        </div>

        <div className="detailed-feedback">
          <h3>Section-wise Feedback</h3>
          {Object.entries(
            resume_analysis_report.section_wise_detailed_feedback
          ).map(([section, feedback]) => {
            if (section === "missing_sections") return null;
            return (
              <div key={section} className="section-feedback">
                <h4>{section.replace("_", " ").toUpperCase()}</h4>
                <p>
                  <strong>Current State:</strong>{" "}
                  {(feedback as any).current_state}
                </p>
                <div className="strengths">
                  <strong>Strengths:</strong>
                  <ul>
                    {(feedback as any).strengths.map(
                      (strength: string, index: number) => (
                        <li key={index}>{strength}</li>
                      )
                    )}
                  </ul>
                </div>
                <div className="improvements">
                  <strong>Improvements:</strong>
                  <ul>
                    {(feedback as any).improvements.map(
                      (improvement: string, index: number) => (
                        <li key={index}>{improvement}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="final-assessment">
          <h3>Final Assessment</h3>
          <p>
            <strong>Eligibility Status:</strong>{" "}
            {resume_analysis_report.final_assessment.eligibility_status}
          </p>
          <p>
            <strong>Hiring Recommendation:</strong>{" "}
            {resume_analysis_report.final_assessment.hiring_recommendation}
          </p>
          <p>
            <strong>Long-term Potential:</strong>{" "}
            {resume_analysis_report.final_assessment.long_term_potential}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* File upload form */}
      {/* ... */}

      {loading && <div>Analyzing resume...</div>}
      {renderAnalysisReport()}
    </div>
  );
};
```

## Migration Strategy

### Phase 1: Add New Endpoint (Backward Compatible)

1. Deploy updated Python service
2. Add new Node.js routes alongside existing ones
3. Test new comprehensive analysis endpoint

### Phase 2: Frontend Integration

1. Update frontend to use new comprehensive endpoint
2. Display enhanced analysis results
3. Keep fallback to legacy endpoint if needed

### Phase 3: Full Migration (Optional)

1. Update all frontend calls to use comprehensive analysis
2. Remove legacy endpoint calls
3. Keep legacy endpoint for API backward compatibility

## Testing

```bash
# Test the comprehensive endpoint directly
curl -X POST "http://localhost:8000/analyze-resume" \
  -F "resume_file=@test_resume.pdf" \
  -F "job_description_text=Software Engineer position requiring Python..."

# Test through Node.js backend
curl -X POST "http://localhost:5000/api/resume/analyze-comprehensive" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "resume=@test_resume.pdf" \
  -F "jobDescriptionText=Software Engineer position..."
```

## Benefits of Comprehensive Analysis

1. **Detailed Insights**: 7 main analysis categories with subcategories
2. **Actionable Feedback**: Specific improvement recommendations
3. **Professional Assessment**: HR-level evaluation and hiring recommendations
4. **Database Integration**: Automatic storage with analysis tracking
5. **Exact JSON Format**: Consistent, validated response structure
6. **Backward Compatibility**: Existing integrations continue to work

The comprehensive analysis provides significantly more value than the legacy analysis while maintaining complete backward compatibility.
