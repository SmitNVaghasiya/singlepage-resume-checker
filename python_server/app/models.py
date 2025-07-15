from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")
        return field_schema


class CandidateInformation(BaseModel):
    name: str
    position_applied: str
    experience_level: str
    current_status: str


class StrengthsAnalysis(BaseModel):
    technical_skills: List[str]
    project_portfolio: List[str]
    educational_background: List[str]


class WeaknessesAnalysis(BaseModel):
    critical_gaps_against_job_description: List[str]
    technical_deficiencies: List[str]
    resume_presentation_issues: List[str]
    soft_skills_gaps: List[str]
    missing_essential_elements: List[str]


class SectionFeedback(BaseModel):
    current_state: str
    strengths: List[str]
    improvements: List[str]


class MissingSections(BaseModel):
    certifications: str
    experience: str
    achievements: str
    soft_skills: Optional[str] = ""


class SectionWiseDetailedFeedback(BaseModel):
    contact_information: SectionFeedback
    profile_summary: SectionFeedback
    education: SectionFeedback
    skills: SectionFeedback
    projects: SectionFeedback
    missing_sections: MissingSections


class ImprovementRecommendations(BaseModel):
    immediate_resume_additions: List[str]
    immediate_priority_actions: List[str]
    short_term_development_goals: List[str]
    medium_term_objectives: List[str]


class SoftSkillsEnhancementSuggestions(BaseModel):
    communication_skills: List[str]
    teamwork_and_collaboration: List[str]
    leadership_and_initiative: List[str]
    problem_solving_approach: List[str]


class FinalAssessment(BaseModel):
    eligibility_status: str
    hiring_recommendation: str
    key_interview_areas: List[str]
    onboarding_requirements: List[str]
    long_term_potential: str


class ResumeAnalysisReport(BaseModel):
    candidate_information: CandidateInformation
    strengths_analysis: StrengthsAnalysis
    weaknesses_analysis: WeaknessesAnalysis
    section_wise_detailed_feedback: SectionWiseDetailedFeedback
    improvement_recommendations: ImprovementRecommendations
    soft_skills_enhancement_suggestions: SoftSkillsEnhancementSuggestions
    final_assessment: FinalAssessment


class ResumeAnalysisResponse(BaseModel):
    job_description_validity: str
    resume_validity: str
    validation_error: Optional[str] = None
    resume_eligibility: str
    score_out_of_100: int
    short_conclusion: str
    chance_of_selection_percentage: int
    resume_improvement_priority: List[str]
    overall_fit_summary: str
    resume_analysis_report: Optional[ResumeAnalysisReport] = None


class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[str] = None


# Database Models
class AnalysisDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    analysis_id: str = Field(..., description="Unique analysis ID")
    user_id: Optional[str] = Field(None, description="User ID if authenticated")
    resume_filename: str = Field(..., description="Original resume filename")
    job_description_filename: Optional[str] = Field(None, description="Job description filename if file upload")
    job_description_text: Optional[str] = Field(None, description="Job description text if text input")
    analysis_result: ResumeAnalysisResponse = Field(..., description="Complete analysis result")
    status: str = Field(default="completed", description="Analysis status")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Analysis creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "analysis_id": "uuid-string",
                "user_id": "user-123",
                "resume_filename": "resume.pdf",
                "job_description_filename": "job_desc.pdf",
                "status": "completed",
                "created_at": "2024-01-01T00:00:00Z"
            }
        }


class AnalysisStatus(BaseModel):
    analysis_id: str
    status: str
    message: str
    progress: Optional[int] = None
    result: Optional[ResumeAnalysisResponse] = None
