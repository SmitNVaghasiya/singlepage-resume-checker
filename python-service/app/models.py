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


# Enhanced models for comprehensive analysis
class KeywordMatch(BaseModel):
    matched: List[str] = []
    missing: List[str] = []
    percentage: float = 0.0
    suggestions: List[str] = []


class SkillCategory(BaseModel):
    required: List[str] = []
    present: List[str] = []
    missing: List[str] = []
    recommendations: List[str] = []


class SkillsAnalysis(BaseModel):
    technical: SkillCategory = Field(default=SkillCategory())
    soft: SkillCategory = Field(default=SkillCategory())
    industry: SkillCategory = Field(default=SkillCategory())


class ExperienceAnalysis(BaseModel):
    years_required: int = 0
    years_found: int = 0
    relevant: bool = False
    experience_gaps: List[str] = []
    strength_areas: List[str] = []
    improvement_areas: List[str] = []


class QualitySubsection(BaseModel):
    score: int = 0
    issues: List[str] = []
    suggestions: List[str] = []


class ResumeQualityAssessment(BaseModel):
    formatting: QualitySubsection = Field(default=QualitySubsection())
    content: QualitySubsection = Field(default=QualitySubsection())
    length: Dict[str, Any] = Field(default={
        "score": 0,
        "wordCount": 0,
        "recommendations": []
    })
    structure: Dict[str, Any] = Field(default={
        "score": 0,
        "missingSections": [],
        "suggestions": []
    })


class CompetitiveAnalysis(BaseModel):
    positioning_strength: int = 0
    competitor_comparison: List[str] = []
    differentiators: List[str] = []
    market_position: str = ""
    improvement_impact: List[str] = []


class ImprovementItem(BaseModel):
    priority: str = Field(default="medium", description="Priority level: high, medium, low")
    actions: List[str] = []
    estimated_impact: str = ""


class ImprovementPlan(BaseModel):
    immediate: List[ImprovementItem] = []
    short_term: List[ImprovementItem] = []
    long_term: List[ImprovementItem] = []


class FeedbackStrength(BaseModel):
    category: str
    points: List[str] = []
    impact: str = ""


class FeedbackWeakness(BaseModel):
    category: str
    points: List[str] = []
    impact: str = ""
    solutions: List[str] = []


class DetailedFeedback(BaseModel):
    strengths: List[FeedbackStrength] = []
    weaknesses: List[FeedbackWeakness] = []
    quick_wins: List[str] = []
    industry_insights: List[str] = []


class AnalysisResult(BaseModel):
    # Core compatibility scores
    score: float = Field(..., ge=0, le=100, description="Overall match score (0-100)")
    
    # Legacy fields for backward compatibility
    strengths: List[str] = Field(default=[], description="Resume strengths")
    weaknesses: List[str] = Field(default=[], description="Areas for improvement")
    suggestions: List[str] = Field(default=[], description="Improvement suggestions")
    
    # Basic analysis fields
    keyword_match: KeywordMatch = Field(default=KeywordMatch())
    skills_analysis: SkillsAnalysis = Field(default=SkillsAnalysis())
    experience_analysis: ExperienceAnalysis = Field(default=ExperienceAnalysis())
    overall_recommendation: str = Field(default="", description="Overall recommendation")
    
    # Enhanced comprehensive analysis fields (optional for backward compatibility)
    overall_score: Optional[float] = Field(default=None, description="Comprehensive overall score")
    match_percentage: Optional[float] = Field(default=None, description="Job match percentage")
    job_title: Optional[str] = Field(default=None, description="Target job title")
    industry: Optional[str] = Field(default=None, description="Industry/field")
    resume_quality: Optional[ResumeQualityAssessment] = Field(default=None)
    competitive_analysis: Optional[CompetitiveAnalysis] = Field(default=None)
    detailed_feedback: Optional[DetailedFeedback] = Field(default=None)
    improvement_plan: Optional[ImprovementPlan] = Field(default=None)
    ai_insights: Optional[List[str]] = Field(default=None)
    candidate_strengths: Optional[List[str]] = Field(default=None)
    development_areas: Optional[List[str]] = Field(default=None)
    confidence: Optional[float] = Field(default=None, description="Analysis confidence level")
    processing_time: Optional[float] = Field(default=None, description="Processing time in seconds")


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
    analysis_id: str
    status: str
    message: str
    result: Optional[AnalysisResult] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    services: Dict[str, Any]
    
    @validator('timestamp', pre=True, always=True)
    def set_timestamp(cls, v):
        return v or datetime.utcnow() 