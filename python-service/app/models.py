from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


# Comprehensive AI Analysis Models (for new endpoint)
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
    soft_skills: str


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
    resume_eligibility: str
    score_out_of_100: int
    short_conclusion: str
    chance_of_selection_percentage: int
    resume_improvement_priority: List[str]
    overall_fit_summary: str
    resume_analysis_report: ResumeAnalysisReport


class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[str] = None


# Legacy Models (for backward compatibility with existing /analyze endpoint)
class KeywordMatch(BaseModel):
    matched: List[str] = []
    missing: List[str] = []
    percentage: float = 0.0
    total_found: int = 0


class AnalysisResult(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall score out of 100")
    strengths: List[str] = Field(..., description="List of candidate strengths")
    weaknesses: List[str] = Field(..., description="List of areas for improvement")
    suggestions: List[str] = Field(..., description="List of improvement suggestions")
    keyword_match: KeywordMatch = Field(..., description="Keyword matching analysis")
    overall_recommendation: str = Field(..., description="Overall hiring recommendation")


class AnalysisDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    analysis_id: str = Field(..., description="Unique analysis identifier")
    resume_filename: str = Field(..., description="Original resume filename")
    job_description_filename: str = Field(..., description="Original job description filename")
    resume_text: str = Field(..., description="Extracted resume text")
    job_description_text: str = Field(..., description="Extracted job description text")
    result: AnalysisResult = Field(..., description="Analysis results")
    created_at: datetime = Field(default=None, description="Creation timestamp")
    updated_at: datetime = Field(default=None, description="Update timestamp")

    @validator('created_at', 'updated_at', pre=True, always=True)
    def set_datetime(cls, v):
        return v or datetime.utcnow()

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class AnalysisResponse(BaseModel):
    success: bool
    analysis: AnalysisResult
    metadata: Dict[str, Any]


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    services: Dict[str, Any]
    
    @validator('timestamp', pre=True, always=True)
    def set_timestamp(cls, v):
        return v or datetime.utcnow() 