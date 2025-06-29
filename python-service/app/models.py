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


class KeywordMatch(BaseModel):
    matched: List[str] = []
    missing: List[str] = []
    percentage: float = 0.0


class SkillsAnalysis(BaseModel):
    required: List[str] = []
    present: List[str] = []
    missing: List[str] = []


class ExperienceAnalysis(BaseModel):
    years_required: int = 0
    years_found: int = 0
    relevant: bool = False


class AnalysisResult(BaseModel):
    score: float = Field(..., ge=0, le=100, description="Overall match score (0-100)")
    strengths: List[str] = Field(default=[], description="Resume strengths")
    weaknesses: List[str] = Field(default=[], description="Areas for improvement")
    suggestions: List[str] = Field(default=[], description="Improvement suggestions")
    keyword_match: KeywordMatch = Field(default=KeywordMatch())
    skills_analysis: SkillsAnalysis = Field(default=SkillsAnalysis())
    experience_analysis: ExperienceAnalysis = Field(default=ExperienceAnalysis())
    overall_recommendation: str = Field(default="", description="Overall recommendation")


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