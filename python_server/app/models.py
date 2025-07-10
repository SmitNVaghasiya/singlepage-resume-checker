from pydantic import BaseModel, Field, field_validator
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
    def __get_pydantic_json_schema__(cls, field_schema, field):
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
    resume_validity: Optional[str] = None  # Added for resume validation
    validation_error: Optional[str] = None  # Added for temp folder compatibility
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
    
    # Additional fields for comprehensive analysis
    skills_analysis: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Skills analysis")
    experience_analysis: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Experience analysis")
    overall_score: Optional[float] = Field(default=None, description="Overall score as float")
    match_percentage: Optional[float] = Field(default=None, description="Match percentage")
    job_title: Optional[str] = Field(default=None, description="Job title")
    industry: Optional[str] = Field(default=None, description="Industry")
    resume_quality: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Resume quality analysis")
    competitive_analysis: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Competitive analysis")
    detailed_feedback: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Detailed feedback")
    improvement_plan: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Improvement plan")
    ai_insights: Optional[List[str]] = Field(default_factory=list, description="AI insights")
    candidate_strengths: Optional[List[str]] = Field(default_factory=list, description="Candidate strengths")
    development_areas: Optional[List[str]] = Field(default_factory=list, description="Development areas")
    confidence: Optional[float] = Field(default=None, description="Confidence level")
    processing_time: Optional[float] = Field(default=None, description="Processing time")


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

    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def set_datetime(cls, v):
        return v or datetime.utcnow()

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str
    message: str
    result: AnalysisResult


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    services: Dict[str, Any]
    
    @field_validator('timestamp', mode='before')
    @classmethod
    def set_timestamp(cls, v):
        return v or datetime.utcnow() 