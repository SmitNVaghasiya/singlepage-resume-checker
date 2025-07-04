import os
import json
import logging
import time
from typing import Dict, Any, Optional
from groq import Groq
from .config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GroqService:
    """Service for AI-powered resume analysis using Groq"""
    
    def __init__(self):
        self.api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
        self.model = settings.groq_model or os.getenv("GROQ_MODEL", "llama3-70b-8192")
        
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is required but not provided")
        
        self.client = Groq(api_key=self.api_key)
        logger.info(f"GroqService initialized with model: {self.model}")
    
    def validate_job_description(self, job_description: str) -> Dict[str, Any]:
        """Validate if the provided text is a valid job description"""
        try:
            prompt = f"""
            Analyze the following text and determine if it's a valid job description.
            
            Text to analyze:
            {job_description}
            
            Respond with ONLY a JSON object in this exact format:
            {{
                "is_valid": true/false,
                "reason": "explanation of why it's valid or invalid"
            }}
            
            A valid job description should contain:
            - Job title or position name
            - Job responsibilities or duties
            - Required skills or qualifications
            - Company information (optional but preferred)
            
            Invalid examples include: personal information, resumes, random text, product descriptions, etc.
            """
            
            response = self._get_ai_response(prompt, max_tokens=200)
            
            # Parse JSON response
            try:
                result = json.loads(response)
                return {
                    "is_valid": result.get("is_valid", False),
                    "reason": result.get("reason", "Unknown validation result")
                }
            except json.JSONDecodeError:
                logger.error(f"Failed to parse JSON from AI response: {response}")
                return {
                    "is_valid": False,
                    "reason": "Failed to validate job description format"
                }
                
        except Exception as e:
            logger.error(f"Error validating job description: {str(e)}")
            return {
                "is_valid": False,
                "reason": f"Validation service error: {str(e)}"
            }
    
    def analyze_resume(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """Perform comprehensive resume analysis against job description"""
        try:
            prompt = self._build_analysis_prompt(resume_text, job_description)
            response = self._get_ai_response(prompt, max_tokens=4000)
            
            # Parse JSON response
            try:
                result = json.loads(response)
                logger.info("✅ Resume analysis completed successfully")
                return result
            except json.JSONDecodeError:
                logger.error(f"Failed to parse JSON from AI analysis response")
                logger.error(f"Raw response: {response[:500]}...")
                
                # Try to extract JSON from response if it's wrapped in text
                try:
                    # Look for JSON pattern
                    start_idx = response.find('{')
                    end_idx = response.rfind('}') + 1
                    if start_idx != -1 and end_idx > start_idx:
                        json_part = response[start_idx:end_idx]
                        result = json.loads(json_part)
                        logger.info("✅ Extracted JSON from wrapped response")
                        return result
                except:
                    pass
                
                raise Exception("AI response is not valid JSON format")
                
        except Exception as e:
            logger.error(f"Error in resume analysis: {str(e)}")
            return None
    
    def _build_analysis_prompt(self, resume_text: str, job_description: str) -> str:
        """Build the comprehensive analysis prompt"""
        return f"""
        You are an expert HR professional and resume analyst. Analyze the following resume against the job description and provide a comprehensive assessment.

        RESUME:
        {resume_text}

        JOB DESCRIPTION:
        {job_description}

        Provide your analysis in EXACTLY this JSON format (no additional text, just valid JSON):

        {{
            "job_description_validity": "Valid",
            "resume_eligibility": "Eligible|Not Eligible|Partially Eligible",
            "score_out_of_100": 85,
            "short_conclusion": "Brief 1-2 sentence conclusion about candidate fit",
            "chance_of_selection_percentage": 75,
            "resume_improvement_priority": [
                "Specific improvement suggestion 1",
                "Specific improvement suggestion 2",
                "Specific improvement suggestion 3",
                "Specific improvement suggestion 4"
            ],
            "overall_fit_summary": "Detailed summary of how well the resume matches the job requirements",
            "resume_analysis_report": {{
                "candidate_information": {{
                    "name": "Candidate Name (extract from resume)",
                    "position_applied": "Job Title from job description",
                    "experience_level": "Entry Level|Mid Level|Senior Level",
                    "current_status": "Current employment/education status"
                }},
                "strengths_analysis": {{
                    "technical_skills": ["skill1", "skill2", "skill3"],
                    "project_portfolio": ["project strength 1", "project strength 2"],
                    "educational_background": ["education strength 1", "education strength 2"]
                }},
                "weaknesses_analysis": {{
                    "critical_gaps_against_job_description": ["gap1", "gap2"],
                    "technical_deficiencies": ["deficiency1", "deficiency2"],
                    "resume_presentation_issues": ["issue1", "issue2"],
                    "soft_skills_gaps": ["gap1", "gap2"],
                    "missing_essential_elements": ["missing1", "missing2"]
                }},
                "section_wise_detailed_feedback": {{
                    "contact_information": {{
                        "current_state": "Description of current state",
                        "strengths": ["strength1", "strength2"],
                        "improvements": ["improvement1", "improvement2"]
                    }},
                    "profile_summary": {{
                        "current_state": "Description of current state",
                        "strengths": ["strength1", "strength2"],
                        "improvements": ["improvement1", "improvement2"]
                    }},
                    "education": {{
                        "current_state": "Description of current state",
                        "strengths": ["strength1", "strength2"],
                        "improvements": ["improvement1", "improvement2"]
                    }},
                    "skills": {{
                        "current_state": "Description of current state",
                        "strengths": ["strength1", "strength2"],
                        "improvements": ["improvement1", "improvement2"]
                    }},
                    "projects": {{
                        "current_state": "Description of current state",
                        "strengths": ["strength1", "strength2"],
                        "improvements": ["improvement1", "improvement2"]
                    }},
                    "missing_sections": {{
                        "certifications": "Assessment of certifications section",
                        "experience": "Assessment of experience section",
                        "achievements": "Assessment of achievements section",
                        "soft_skills": "Assessment of soft skills section"
                    }}
                }},
                "improvement_recommendations": {{
                    "immediate_resume_additions": ["addition1", "addition2"],
                    "immediate_priority_actions": ["action1", "action2"],
                    "short_term_development_goals": ["goal1", "goal2"],
                    "medium_term_objectives": ["objective1", "objective2"]
                }},
                "soft_skills_enhancement_suggestions": {{
                    "communication_skills": ["suggestion1", "suggestion2"],
                    "teamwork_and_collaboration": ["suggestion1", "suggestion2"],
                    "leadership_and_initiative": ["suggestion1", "suggestion2"],
                    "problem_solving_approach": ["suggestion1", "suggestion2"]
                }},
                "final_assessment": {{
                    "eligibility_status": "Qualified|Not Qualified|Qualified with Conditions",
                    "hiring_recommendation": "Detailed hiring recommendation",
                    "key_interview_areas": ["area1", "area2", "area3"],
                    "onboarding_requirements": ["requirement1", "requirement2"],
                    "long_term_potential": "Assessment of long-term potential"
                }}
            }}
        }}

        IMPORTANT INSTRUCTIONS:
        1. Return ONLY valid JSON - no markdown, no extra text, no explanations
        2. Ensure all arrays have meaningful content (minimum 2-3 items each)
        3. Make recommendations specific and actionable
        4. Score should be realistic based on actual match quality
        5. Be thorough but concise in all descriptions
        6. Ensure all required fields are filled with meaningful content
        """
    
    def _get_ai_response(self, prompt: str, max_tokens: int = 2000) -> str:
        """Get response from Groq AI with error handling and retries"""
        max_retries = 3
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                chat_completion = self.client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert HR professional and resume analyst with extensive experience in candidate evaluation. Always respond with valid JSON when requested. Be detailed, accurate, and actionable in your analysis."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    model=self.model,
                    temperature=0.3,  # Lower temperature for more consistent JSON output
                    max_tokens=max_tokens,
                    top_p=0.95
                )
                
                return chat_completion.choices[0].message.content
                
            except Exception as e:
                logger.warning(f"AI request attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                else:
                    raise e
    
    async def check_health(self) -> Dict[str, Any]:
        """Check if Groq service is healthy"""
        try:
            # Simple test query
            test_response = self._get_ai_response("Respond with only: {'status': 'healthy'}", max_tokens=50)
            return {
                "status": "healthy",
                "model": self.model,
                "test_response": "success"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "model": self.model
            } 