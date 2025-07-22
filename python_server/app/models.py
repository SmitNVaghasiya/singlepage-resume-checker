from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class CandidateInformation(BaseModel):
    name: str = Field(..., description="Candidate's full name")
    position_applied: str = Field(..., description="Position the candidate is applying for")
    experience_level: str = Field(..., description="Candidate's experience level (e.g., Entry Level, Junior, Mid-level, Senior)")
    current_status: str = Field(..., description="Candidate's current employment status (e.g., Student, Recent Graduate, Professional)")

class StrengthsAnalysis(BaseModel):
    technical_skills: List[str] = Field(..., description="List of candidate's technical skills")
    project_portfolio: List[str] = Field(..., description="List of candidate's projects")
    educational_background: List[str] = Field(..., description="List of candidate's educational qualifications")

class WeaknessesAnalysis(BaseModel):
    critical_gaps_against_job_description: List[str] = Field(..., description="Gaps compared to the job description")
    technical_deficiencies: List[str] = Field(..., description="Technical skills needing improvement")
    resume_presentation_issues: List[str] = Field(..., description="Issues with resume formatting")
    soft_skills_gaps: List[str] = Field(..., description="Soft skills needing development")
    missing_essential_elements: List[str] = Field(..., description="Missing resume elements")

class SectionFeedback(BaseModel):
    current_state: str = Field(..., description="Current state of the section")
    strengths: List[str] = Field(..., description="Section strengths")
    improvements: List[str] = Field(..., description="Suggestions for improvement")

class MissingSections(BaseModel):
    certifications: str = Field(..., description="Feedback on certifications")
    experience: str = Field(..., description="Feedback on experience")
    achievements: str = Field(..., description="Feedback on achievements")
    soft_skills: str = Field(..., description="Feedback on soft skills")

class SectionWiseDetailedFeedback(BaseModel):
    contact_information: SectionFeedback = Field(..., description="Contact info feedback")
    profile_summary: SectionFeedback = Field(..., description="Profile summary feedback")
    education: SectionFeedback = Field(..., description="Education feedback")
    skills: SectionFeedback = Field(..., description="Skills feedback")
    projects: SectionFeedback = Field(..., description="Projects feedback")
    missing_sections: MissingSections = Field(..., description="Missing sections feedback")

class ImprovementRecommendations(BaseModel):
    immediate_resume_additions: List[str] = Field(..., description="Immediate resume additions")
    immediate_priority_actions: List[str] = Field(..., description="Priority actions")
    short_term_development_goals: List[str] = Field(..., description="Short-term goals")
    medium_term_objectives: List[str] = Field(..., description="Medium-term objectives")

class SoftSkillsEnhancementSuggestions(BaseModel):
    communication_skills: List[str] = Field(..., description="Communication skill suggestions")
    teamwork_and_collaboration: List[str] = Field(..., description="Teamwork suggestions")
    leadership_and_initiative: List[str] = Field(..., description="Leadership suggestions")
    problem_solving_approach: List[str] = Field(..., description="Problem-solving suggestions")

class FinalAssessment(BaseModel):
    eligibility_status: str = Field(..., description="Eligibility status")
    hiring_recommendation: str = Field(..., description="Hiring recommendation")
    key_interview_areas: List[str] = Field(..., description="Interview focus areas")
    onboarding_requirements: List[str] = Field(..., description="Onboarding needs")
    long_term_potential: str = Field(..., description="Long-term potential assessment")

class ResumeAnalysisReport(BaseModel):
    candidate_information: CandidateInformation = Field(..., description="Candidate details")
    strengths_analysis: StrengthsAnalysis = Field(..., description="Strengths analysis")
    weaknesses_analysis: WeaknessesAnalysis = Field(..., description="Weaknesses analysis")
    section_wise_detailed_feedback: SectionWiseDetailedFeedback = Field(..., description="Section feedback")
    improvement_recommendations: ImprovementRecommendations = Field(..., description="Improvement recommendations")
    soft_skills_enhancement_suggestions: SoftSkillsEnhancementSuggestions = Field(..., description="Soft skills suggestions")
    final_assessment: FinalAssessment = Field(..., description="Final assessment")

class ResumeAnalysisResponse(BaseModel):
    job_description_validity: str = Field(..., description="Job description validity")
    resume_validity: str = Field(..., description="Resume validity")
    validation_error: Optional[str] = Field(None, description="Validation error message")
    resume_eligibility: str = Field(..., description="Resume eligibility")
    score_out_of_100: int = Field(..., description="Resume score out of 100")
    short_conclusion: str = Field(..., description="Analysis summary")
    chance_of_selection_percentage: int = Field(..., description="Selection chance percentage")
    resume_improvement_priority: List[str] = Field(..., description="Improvement priorities")
    overall_fit_summary: str = Field(..., description="Overall fit summary")
    resume_analysis_report: Optional[ResumeAnalysisReport] = Field(None, description="Detailed analysis report")

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[str] = Field(None, description="Additional error details")

class AnalysisDocument(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="MongoDB document ID")
    analysis_id: str = Field(..., description="Unique analysis ID")
    user_id: Optional[str] = Field(None, description="User ID if authenticated")
    resume_filename: str = Field(..., description="Original resume filename")
    job_description_filename: Optional[str] = Field(None, description="Job description filename")
    job_description_text: Optional[str] = Field(None, description="Job description text")
    analysis_result: ResumeAnalysisResponse = Field(..., description="Analysis result")
    status: str = Field(default="completed", description="Analysis status")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")

    model_config = {
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "analysis_id": "uuid-string",
                "user_id": "user-123",
                "resume_filename": "resume.pdf",
                "job_description_filename": "job_desc.pdf",
                "status": "completed",
                "created_at": "2024-01-01T00:00:00Z"
            }
        }
    }

class AnalysisStatus(BaseModel):
    analysis_id: str = Field(..., description="Unique analysis ID")
    status: str = Field(..., description="Current status")
    message: str = Field(..., description="Status message")
    progress: Optional[int] = Field(None, description="Progress percentage")
    result: Optional[ResumeAnalysisResponse] = Field(None, description="Analysis result if completed")