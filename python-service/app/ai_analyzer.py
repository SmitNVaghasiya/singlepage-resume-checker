import json
import re
from typing import Dict, List, Tuple
from groq import Groq
from loguru import logger
from .config import settings
from .models import AnalysisResult, KeywordMatch, SkillsAnalysis, ExperienceAnalysis


class AIAnalyzer:
    def __init__(self):
        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is required")
        
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model

    async def analyze_resume(self, resume_text: str, job_description_text: str) -> AnalysisResult:
        """Analyze resume against job description using Groq AI"""
        try:
            # Create the analysis prompt
            prompt = self._create_analysis_prompt(resume_text, job_description_text)
            
            # Get AI analysis
            response = await self._get_ai_response(prompt)
            
            # Parse the response
            analysis_result = self._parse_ai_response(response)
            
            # Enhance with additional analysis
            analysis_result = await self._enhance_analysis(
                analysis_result, resume_text, job_description_text
            )
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error in AI analysis: {e}")
            raise

    def _create_analysis_prompt(self, resume_text: str, job_description_text: str) -> str:
        """Create comprehensive analysis prompt for AI"""
        prompt = f"""
You are an expert HR recruiter and resume analyst. Analyze the following resume against the job description and provide a comprehensive evaluation.

**JOB DESCRIPTION:**
{job_description_text}

**RESUME:**
{resume_text}

Please provide a detailed analysis in the following JSON format:

{{
    "score": <overall_match_score_0_to_100>,
    "strengths": [<list_of_resume_strengths>],
    "weaknesses": [<list_of_areas_for_improvement>],
    "suggestions": [<specific_improvement_recommendations>],
    "keyword_match": {{
        "matched": [<keywords_found_in_resume>],
        "missing": [<important_keywords_missing>],
        "percentage": <percentage_of_keywords_matched>
    }},
    "skills_analysis": {{
        "required": [<skills_required_for_job>],
        "present": [<skills_found_in_resume>],
        "missing": [<critical_skills_missing>]
    }},
    "experience_analysis": {{
        "years_required": <years_of_experience_required>,
        "years_found": <years_of_experience_found_in_resume>,
        "relevant": <true_if_experience_is_relevant>
    }},
    "overall_recommendation": "<detailed_recommendation_for_candidate>"
}}

**Analysis Guidelines:**
1. Score should be based on overall fit (0-100)
2. Be specific and actionable in suggestions
3. Focus on technical skills, soft skills, and experience alignment
4. Consider industry-specific requirements
5. Identify both obvious and subtle matches/gaps
6. Provide constructive feedback

Respond ONLY with the JSON object, no additional text.
"""
        return prompt

    async def _get_ai_response(self, prompt: str) -> str:
        """Get response from Groq AI"""
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert HR recruiter and resume analyst. Provide detailed, accurate, and actionable resume analysis."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=self.model,
                temperature=0.3,
                max_tokens=2000
            )
            
            return chat_completion.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error getting AI response: {e}")
            raise

    def _parse_ai_response(self, response: str) -> AnalysisResult:
        """Parse AI response into AnalysisResult model"""
        try:
            # Clean the response - remove any markdown formatting
            cleaned_response = response.strip()
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith('```'):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()
            
            # Parse JSON
            data = json.loads(cleaned_response)
            
            # Create model instances
            keyword_match = KeywordMatch(**data.get("keyword_match", {}))
            skills_analysis = SkillsAnalysis(**data.get("skills_analysis", {}))
            experience_analysis = ExperienceAnalysis(**data.get("experience_analysis", {}))
            
            # Create main result
            analysis_result = AnalysisResult(
                score=float(data.get("score", 0)),
                strengths=data.get("strengths", []),
                weaknesses=data.get("weaknesses", []),
                suggestions=data.get("suggestions", []),
                keyword_match=keyword_match,
                skills_analysis=skills_analysis,
                experience_analysis=experience_analysis,
                overall_recommendation=data.get("overall_recommendation", "")
            )
            
            return analysis_result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Response content: {response}")
            
            # Fallback analysis
            return self._create_fallback_analysis()
            
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
            return self._create_fallback_analysis()

    def _create_fallback_analysis(self) -> AnalysisResult:
        """Create a basic fallback analysis when AI parsing fails"""
        return AnalysisResult(
            score=50.0,
            strengths=["Resume submitted for analysis"],
            weaknesses=["Unable to perform detailed analysis"],
            suggestions=["Please try again or contact support"],
            keyword_match=KeywordMatch(matched=[], missing=[], percentage=0.0),
            skills_analysis=SkillsAnalysis(required=[], present=[], missing=[]),
            experience_analysis=ExperienceAnalysis(years_required=0, years_found=0, relevant=False),
            overall_recommendation="Analysis could not be completed. Please try again."
        )

    async def _enhance_analysis(
        self, 
        analysis: AnalysisResult, 
        resume_text: str, 
        job_description_text: str
    ) -> AnalysisResult:
        """Enhance analysis with additional processing"""
        try:
            # Add basic keyword matching if missing
            if not analysis.keyword_match.matched and not analysis.keyword_match.missing:
                enhanced_keywords = self._extract_keywords_basic(resume_text, job_description_text)
                analysis.keyword_match = enhanced_keywords
            
            # Validate score range
            if analysis.score < 0:
                analysis.score = 0.0
            elif analysis.score > 100:
                analysis.score = 100.0
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error enhancing analysis: {e}")
            return analysis

    def _extract_keywords_basic(self, resume_text: str, job_description_text: str) -> KeywordMatch:
        """Basic keyword extraction as fallback"""
        try:
            # Simple keyword extraction
            job_words = set(re.findall(r'\b[A-Za-z]{3,}\b', job_description_text.lower()))
            resume_words = set(re.findall(r'\b[A-Za-z]{3,}\b', resume_text.lower()))
            
            # Common technical terms and skills
            technical_terms = {
                'python', 'javascript', 'java', 'react', 'angular', 'node', 'sql', 'mongodb',
                'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'api', 'rest',
                'html', 'css', 'typescript', 'vue', 'express', 'django', 'flask'
            }
            
            # Filter for relevant keywords
            job_keywords = job_words.intersection(technical_terms)
            matched = list(job_keywords.intersection(resume_words))
            missing = list(job_keywords - resume_words)
            
            percentage = (len(matched) / len(job_keywords)) * 100 if job_keywords else 0
            
            return KeywordMatch(
                matched=matched[:10],  # Limit to top 10
                missing=missing[:10],   # Limit to top 10
                percentage=round(percentage, 2)
            )
            
        except Exception as e:
            logger.error(f"Error in basic keyword extraction: {e}")
            return KeywordMatch(matched=[], missing=[], percentage=0.0)

    async def check_ai_health(self) -> Dict[str, str]:
        """Check AI service health"""
        try:
            # Simple test prompt
            test_response = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": "Respond with 'OK' if you are working properly."
                    }
                ],
                model=self.model,
                temperature=0,
                max_tokens=10
            )
            
            if test_response.choices[0].message.content:
                return {"status": "healthy", "model": self.model}
            else:
                return {"status": "error", "error": "No response from AI"}
                
        except Exception as e:
            return {"status": "error", "error": str(e)}


# Global AI analyzer instance
ai_analyzer = AIAnalyzer() 