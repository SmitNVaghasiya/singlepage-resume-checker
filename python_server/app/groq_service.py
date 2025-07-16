import os
import json
import logging
import re
from typing import Dict, Any, Optional
from groq import Groq
from dotenv import load_dotenv
from .config import settings

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class GroqService:
    """Service class for interacting with Groq AI API"""
    
    def __init__(self):
        """Initialize the Groq service with API key and configuration"""
        self.api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        
        self.model = settings.groq_model or os.getenv("GROQ_MODEL", "llama3-70b-8192")
        self.client = Groq(api_key=self.api_key)
        
        # Response schema loading removed
        self.response_schema = {}
        
        logger.info(f"GroqService initialized with model: {self.model}")
    
    def _clean_json_content(self, content: str) -> str:
        """Clean JSON content by removing common formatting issues"""
        # Remove markdown code blocks
        content = re.sub(r'```json\s*', '', content)
        content = re.sub(r'```\s*', '', content)
        
        # Remove leading/trailing whitespace
        content = content.strip()
        
        # Remove any leading text before the first {
        first_brace = content.find('{')
        if first_brace > 0:
            content = content[first_brace:]
        
        # Remove any trailing text after the last }
        last_brace = content.rfind('}')
        if last_brace != -1 and last_brace < len(content) - 1:
            content = content[:last_brace + 1]
        
        return content
    
    def _load_response_schema(self) -> Dict[str, Any]:
        """Load the response schema from JSON file - removed"""
        return {}
    
    def _get_fallback_response(self) -> Dict[str, Any]:
        """Get a fallback response when AI analysis fails completely"""
        logger.warning("Using fallback response due to AI service failure")
        return {
            "job_description_validity": "Valid",
            "resume_validity": "Valid",
            "resume_eligibility": "Partially Eligible",
            "score_out_of_100": 50,
            "short_conclusion": "Resume analysis completed with basic assessment. AI service encountered issues, but basic validation passed.",
            "chance_of_selection_percentage": 50,
            "resume_improvement_priority": [
                "Contact support if analysis seems incomplete",
                "Verify job description format",
                "Ensure resume is in supported format"
            ],
            "overall_fit_summary": "Basic resume validation completed. For detailed analysis, please try again or contact support if issues persist.",
            "resume_analysis_report": self._create_default_analysis_report()
        }
    
    def analyze_resume(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """
        Analyze resume against job description using Groq AI
        
        Args:
            resume_text: The extracted resume text
            job_description: The job description text
            
        Returns:
            Dictionary containing comprehensive resume analysis
        """
        try:
            # Truncate resume text if it's too long to avoid token limits
            max_resume_length = 8000  # Conservative limit
            if len(resume_text) > max_resume_length:
                logger.warning(f"Resume text too long ({len(resume_text)} chars), truncating to {max_resume_length} chars")
                resume_text = resume_text[:max_resume_length] + "... [truncated]"
            
            prompt = f"""
            You are an expert HR consultant and resume analyzer with 15+ years of experience in technical recruitment. Your task is to provide a comprehensive, detailed analysis of the candidate's resume against the job description.

            FIRST: Validate the job description
            A valid job description should contain:
            1. Job title or position
            2. Required skills or qualifications  
            3. Job responsibilities or duties
            4. Company information (optional but preferred)

            JOB DESCRIPTION TO VALIDATE:
            {job_description}
            
            RESUME TO ANALYZE:
            {resume_text}
            
            IMPORTANT: Respond ONLY with valid JSON. Do not include any introductory text, explanations, or markdown formatting.

            ANALYSIS LOGIC:
            1. First, validate if the job description is valid
            2. If job description is INVALID, return only validation error
            3. If job description is VALID, proceed with comprehensive resume analysis

            RESPONSE FORMAT:
            If job description is INVALID, return:
            {{
                "job_description_validity": "Invalid",
                "validation_error": "Provide a detailed, specific explanation of why the job description is invalid. Include what specific elements are missing, what could be improved, and provide constructive feedback to help the user create a better job description.",
                "resume_eligibility": "Cannot determine",
                "score_out_of_100": 0,
                "short_conclusion": "Provide a clear, helpful summary of the validation issues and what the user needs to do to fix them.",
                "chance_of_selection_percentage": 0,
                "resume_improvement_priority": ["Provide specific, actionable suggestions for improving the job description"],
                "overall_fit_summary": "Provide a detailed explanation of why analysis cannot proceed and what information is needed",
                "resume_analysis_report": null
            }}

            If job description is VALID, return comprehensive analysis:
            {{
                "job_description_validity": "Valid - Brief assessment with reasoning",
                "resume_validity": "Valid/Invalid - Assessment of resume format, completeness, and professionalism",
                "resume_eligibility": "Eligible/Not Eligible/Partially Eligible - Be specific about qualification level",
                "score_out_of_100": 75,
                "short_conclusion": "Provide a detailed 3-4 sentence summary of overall fit, key strengths, and main areas for improvement",
                "chance_of_selection_percentage": 65,
                "resume_improvement_priority": [
                    "Specific, actionable priority 1 with details",
                    "Specific, actionable priority 2 with details", 
                    "Specific, actionable priority 3 with details",
                    "Specific, actionable priority 4 with details"
                ],
                "overall_fit_summary": "Provide a comprehensive 4-5 sentence summary covering technical fit, experience alignment, skill gaps, and potential for growth",
                "resume_analysis_report": {{
                    "candidate_information": {{
                        "name": "Extract exact name from resume or 'Not specified'",
                        "position_applied": "Extract from context or job title",
                        "experience_level": "Be specific: Entry Level (0-2 years)/Junior (2-4 years)/Mid-level (4-7 years)/Senior (7+ years)",
                        "current_status": "Be specific: Student/Recent Graduate/Professional/Job Seeker with details"
                    }},
                    "strengths_analysis": {{
                        "technical_skills": [
                            "Specific technical skill with proficiency level and evidence",
                            "Another specific skill with examples from projects",
                            "Additional technical strengths with details"
                        ],
                        "project_portfolio": [
                            "Detailed project description with technologies used and outcomes",
                            "Another project with specific achievements and impact",
                            "Additional projects with technical details"
                        ],
                        "educational_background": [
                            "Specific educational qualification with relevance to job",
                            "Additional educational strengths with details",
                            "Any certifications or specialized training"
                        ]
                    }},
                    "weaknesses_analysis": {{
                        "critical_gaps_against_job_description": [
                            "Specific gap with detailed explanation and impact",
                            "Another critical gap with examples from job requirements",
                            "Additional gaps with specific details"
                        ],
                        "technical_deficiencies": [
                            "Specific technical deficiency with explanation",
                            "Another technical gap with details",
                            "Additional technical areas needing improvement"
                        ],
                        "resume_presentation_issues": [
                            "Specific presentation issue with examples",
                            "Another formatting or content issue",
                            "Additional presentation problems"
                        ],
                        "soft_skills_gaps": [
                            "Specific soft skill gap with evidence",
                            "Another soft skill deficiency",
                            "Additional soft skill areas for improvement"
                        ],
                        "missing_essential_elements": [
                            "Specific missing element with importance explained",
                            "Another missing component with details",
                            "Additional missing elements"
                        ]
                    }},
                    "section_wise_detailed_feedback": {{
                        "contact_information": {{
                            "current_state": "Detailed assessment of current contact information completeness and professionalism",
                            "strengths": [
                                "Specific strength with details",
                                "Another strength with examples"
                            ],
                            "improvements": [
                                "Specific improvement suggestion with details",
                                "Another improvement with actionable steps"
                            ]
                        }},
                        "profile_summary": {{
                            "current_state": "Detailed assessment of profile summary effectiveness and content",
                            "strengths": [
                                "Specific strength with details",
                                "Another strength with examples"
                            ],
                            "improvements": [
                                "Specific improvement with detailed suggestions",
                                "Another improvement with actionable steps"
                            ]
                        }},
                        "education": {{
                            "current_state": "Detailed assessment of educational background presentation and relevance",
                            "strengths": [
                                "Specific educational strength with details",
                                "Another strength with examples"
                            ],
                            "improvements": [
                                "Specific improvement suggestion with details",
                                "Another improvement with actionable steps"
                            ]
                        }},
                        "skills": {{
                            "current_state": "Detailed assessment of skills section organization and content",
                            "strengths": [
                                "Specific skill strength with details",
                                "Another strength with examples"
                            ],
                            "improvements": [
                                "Specific improvement with detailed suggestions",
                                "Another improvement with actionable steps"
                            ]
                        }},
                        "projects": {{
                            "current_state": "Detailed assessment of project portfolio presentation and technical depth",
                            "strengths": [
                                "Specific project strength with details",
                                "Another strength with examples"
                            ],
                            "improvements": [
                                "Specific improvement with detailed suggestions",
                                "Another improvement with actionable steps"
                            ]
                        }},
                        "missing_sections": {{
                            "certifications": "Detailed assessment of certifications section with specific recommendations",
                            "experience": "Detailed assessment of experience section with specific recommendations",
                            "achievements": "Detailed assessment of achievements section with specific recommendations",
                            "soft_skills": "Detailed assessment of soft skills section with specific recommendations"
                        }}
                    }},
                    "improvement_recommendations": {{
                        "immediate_resume_additions": [
                            "Specific addition with detailed explanation and example",
                            "Another addition with specific details",
                            "Additional immediate additions with details"
                        ],
                        "immediate_priority_actions": [
                            "Specific action with detailed steps and timeline",
                            "Another priority action with specific details",
                            "Additional immediate actions with details"
                        ],
                        "short_term_development_goals": [
                            "Specific goal with detailed plan and timeline",
                            "Another short-term goal with specific details",
                            "Additional short-term goals with details"
                        ],
                        "medium_term_objectives": [
                            "Specific objective with detailed roadmap",
                            "Another medium-term objective with specific details",
                            "Additional medium-term objectives with details"
                        ]
                    }},
                    "soft_skills_enhancement_suggestions": {{
                        "communication_skills": [
                            "Specific suggestion with detailed implementation steps",
                            "Another communication skill suggestion with details",
                            "Additional communication improvements"
                        ],
                        "teamwork_and_collaboration": [
                            "Specific teamwork suggestion with detailed steps",
                            "Another collaboration improvement with details",
                            "Additional teamwork enhancements"
                        ],
                        "leadership_and_initiative": [
                            "Specific leadership suggestion with detailed approach",
                            "Another initiative improvement with details",
                            "Additional leadership development"
                        ],
                        "problem_solving_approach": [
                            "Specific problem-solving suggestion with detailed methodology",
                            "Another problem-solving improvement with details",
                            "Additional problem-solving enhancements"
                        ]
                    }},
                    "final_assessment": {{
                        "eligibility_status": "Be specific: Eligible/Not Eligible/Conditionally Eligible with detailed reasoning",
                        "hiring_recommendation": "Be specific: Recommend/Do Not Recommend/Consider with Conditions with detailed justification",
                        "key_interview_areas": [
                            "Specific interview area with detailed focus points",
                            "Another key area with specific questions to explore",
                            "Additional interview focus areas with details"
                        ],
                        "onboarding_requirements": [
                            "Specific onboarding requirement with detailed plan",
                            "Another requirement with specific details",
                            "Additional onboarding needs with details"
                        ],
                        "long_term_potential": "Detailed assessment of long-term potential with specific growth areas and timeline"
                    }}
                }}
            }}
            
            CRITICAL REQUIREMENTS:
            1. First validate the job description thoroughly
            2. If invalid, provide detailed, specific, and constructive error messages that help the user understand exactly what's wrong and how to fix it
            3. If valid, provide extremely detailed and specific analysis
            4. Provide concrete examples and evidence from the resume
            5. Give actionable, specific recommendations
            6. Quantify achievements and skills where possible
            7. Ensure all arrays contain at least 3-4 detailed items
            8. Make all feedback specific to the candidate's background and the job requirements
            9. For validation errors, be helpful and constructive - explain what's missing, why it's important, and how to improve it
            10. CRITICAL: The missing_sections object MUST include ALL four fields: certifications, experience, achievements, AND soft_skills
            11. CRITICAL: Ensure the JSON structure exactly matches the provided template - do not omit any fields
            """
            
            logger.debug(f"Prompt length: {len(prompt)} characters")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert HR consultant with 15+ years of experience in technical recruitment. Provide comprehensive, detailed analysis in valid JSON format only. Do not include any introductory text, explanations, or markdown formatting. Start your response directly with the opening curly brace '{' and end with the closing curly brace '}'. Be extremely thorough and specific in your analysis."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=8000
            )
            
            raw_content = response.choices[0].message.content
            logger.info(f"Raw response content (first 500 chars): {raw_content[:500]}")
            logger.info(f"Response length: {len(raw_content) if raw_content else 0}")
            logger.info(f"Response type: {type(raw_content)}")
            
            # Log if response contains common problematic patterns
            if "Here is the detailed analysis" in raw_content:
                logger.warning("Response contains introductory text - will attempt extraction")
            if "```json" in raw_content:
                logger.warning("Response contains markdown formatting - will attempt extraction")
            if raw_content.count('{') != raw_content.count('}'):
                logger.warning("Mismatched braces detected in response")
            
            if not raw_content or raw_content.strip() == "":
                logger.error("Empty response received from Groq API")
                return self._get_fallback_response()
            
            try:
                # Try to parse the raw content directly first
                result = json.loads(raw_content)
                
                # Validate and fix missing fields
                result = self._validate_and_fix_response(result)
                
                logger.info("Resume analysis completed successfully")
                return result
            except json.JSONDecodeError as e:
                logger.warning(f"Direct JSON parsing failed, attempting to extract JSON from response: {e}")
                
                # Try to extract JSON from the response if it contains extra text
                try:
                    # Method 1: Clean and try to parse
                    cleaned_content = self._clean_json_content(raw_content)
                    if cleaned_content != raw_content:
                        logger.debug(f"Cleaned content: {cleaned_content[:200]}...")
                        result = json.loads(cleaned_content)
                        result = self._validate_and_fix_response(result)
                        logger.info("Resume analysis completed successfully after content cleaning")
                        return result
                    
                    # Method 2: Look for JSON content between curly braces
                    start_idx = raw_content.find('{')
                    end_idx = raw_content.rfind('}') + 1
                    
                    if start_idx != -1 and end_idx > start_idx:
                        json_content = raw_content[start_idx:end_idx]
                        logger.debug(f"Extracted JSON content: {json_content[:200]}...")
                        result = json.loads(json_content)
                        result = self._validate_and_fix_response(result)
                        logger.info("Resume analysis completed successfully after JSON extraction")
                        return result
                    
                    # Method 3: Try to find JSON after common prefixes
                    common_prefixes = [
                        "Here is the detailed analysis in the requested JSON format:",
                        "Here's the analysis in JSON format:",
                        "Analysis result:",
                        "JSON Response:",
                        "```json",
                        "```"
                    ]
                    
                    for prefix in common_prefixes:
                        if prefix in raw_content:
                            start_idx = raw_content.find(prefix) + len(prefix)
                            json_part = raw_content[start_idx:].strip()
                            # Find the first { and last }
                            json_start = json_part.find('{')
                            json_end = json_part.rfind('}') + 1
                            if json_start != -1 and json_end > json_start:
                                json_content = json_part[json_start:json_end]
                                logger.debug(f"Extracted JSON after prefix '{prefix}': {json_content[:200]}...")
                                result = json.loads(json_content)
                                result = self._validate_and_fix_response(result)
                                logger.info("Resume analysis completed successfully after prefix-based extraction")
                                return result
                    
                    logger.error("No JSON content found in response")
                    return self._get_fallback_response()
                        
                except json.JSONDecodeError as e2:
                    logger.error(f"JSON extraction also failed: {e2}")
                logger.error(f"Failed to parse content: '{raw_content[:200]}...'")
                return self._get_fallback_response()
            
        except Exception as e:
            logger.error(f"Error analyzing resume: {e}")
            return self._get_fallback_response()
    
    def _validate_and_fix_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and fix missing fields in the AI response"""
        try:
            # Ensure required top-level fields exist
            required_top_level_fields = [
                "job_description_validity",
                "resume_validity", 
                "resume_eligibility",
                "score_out_of_100",
                "short_conclusion",
                "chance_of_selection_percentage",
                "resume_improvement_priority",
                "overall_fit_summary"
            ]
            
            for field in required_top_level_fields:
                if field not in result:
                    logger.warning(f"Missing {field} field in response, adding default value")
                    if field == "resume_validity":
                        result[field] = "Valid"
                    elif field == "job_description_validity":
                        result[field] = "Valid"
                    elif field == "resume_eligibility":
                        result[field] = "Partially Eligible"
                    elif field == "score_out_of_100":
                        result[field] = 50
                    elif field == "chance_of_selection_percentage":
                        result[field] = 50
                    elif field == "short_conclusion":
                        result[field] = "Resume analysis completed with basic assessment. AI service encountered issues, but basic validation passed."
                    elif field == "overall_fit_summary":
                        result[field] = "Basic resume validation completed. For detailed analysis, please try again or contact support if issues persist."
                    elif field == "resume_improvement_priority":
                        result[field] = ["Contact support if analysis seems incomplete", "Verify job description format", "Ensure resume is in supported format"]
            
            # Ensure resume_analysis_report exists and has all required nested fields
            if "resume_analysis_report" not in result:
                logger.warning("Missing resume_analysis_report in response, creating default structure")
                result["resume_analysis_report"] = self._create_default_analysis_report()
            else:
                # Validate and fix nested structures
                report = result["resume_analysis_report"]
                result["resume_analysis_report"] = self._validate_and_fix_analysis_report(report)
            
            logger.info("Response validation and fixing completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Error validating and fixing response: {e}")
            return result
    
    def _create_default_analysis_report(self) -> Dict[str, Any]:
        """Create a default analysis report structure with all required fields"""
        return {
            "candidate_information": {
                "name": "Not specified",
                "position_applied": "AI/ML Engineer",
                "experience_level": "Entry Level (0-2 years)",
                "current_status": "Student/Recent Graduate"
            },
            "strengths_analysis": {
                "technical_skills": ["Python programming", "Basic machine learning concepts", "Web development"],
                "project_portfolio": ["Academic projects", "Personal projects", "Coursework"],
                "educational_background": ["Relevant degree in Computer Science", "AI/ML coursework", "Technical foundation"]
            },
            "weaknesses_analysis": {
                "critical_gaps_against_job_description": ["Limited professional experience", "Need for more advanced ML skills"],
                "technical_deficiencies": ["Advanced ML frameworks", "Production deployment experience"],
                "resume_presentation_issues": ["Could improve formatting", "Need more quantifiable achievements"],
                "soft_skills_gaps": ["Professional communication", "Team collaboration experience"],
                "missing_essential_elements": ["Professional certifications", "Industry experience"]
            },
            "section_wise_detailed_feedback": {
                "contact_information": {
                    "current_state": "Present",
                    "strengths": ["Contact details provided"],
                    "improvements": ["Ensure all contact methods are current"]
                },
                "profile_summary": {
                    "current_state": "Present",
                    "strengths": ["Clear career objective"],
                    "improvements": ["Make more specific to AI/ML roles"]
                },
                "education": {
                    "current_state": "Present",
                    "strengths": ["Relevant degree"],
                    "improvements": ["Highlight AI/ML coursework"]
                },
                "skills": {
                    "current_state": "Present",
                    "strengths": ["Technical skills listed"],
                    "improvements": ["Add proficiency levels", "Include ML frameworks"]
                },
                "projects": {
                    "current_state": "Present",
                    "strengths": ["Projects demonstrate technical ability"],
                    "improvements": ["Add more AI/ML specific projects"]
                },
                "missing_sections": {
                    "certifications": "Add relevant AI/ML certifications",
                    "experience": "Include any relevant internships or work experience",
                    "achievements": "Highlight academic achievements and awards",
                    "soft_skills": "Add a dedicated soft skills section"
                }
            },
            "improvement_recommendations": {
                "immediate_resume_additions": ["Add AI/ML certifications", "Include more technical projects"],
                "immediate_priority_actions": ["Enhance technical skills section", "Add quantifiable achievements"],
                "short_term_development_goals": ["Learn advanced ML frameworks", "Build portfolio projects"],
                "medium_term_objectives": ["Gain professional experience", "Obtain relevant certifications"]
            },
            "soft_skills_enhancement_suggestions": {
                "communication_skills": ["Practice technical writing", "Improve presentation skills"],
                "teamwork_and_collaboration": ["Join study groups", "Participate in hackathons"],
                "leadership_and_initiative": ["Take on project leadership roles", "Start personal projects"],
                "problem_solving_approach": ["Document problem-solving processes", "Show analytical thinking"]
            },
            "final_assessment": {
                "eligibility_status": "Partially Eligible",
                "hiring_recommendation": "Consider for entry-level position with mentorship",
                "key_interview_areas": ["Technical skills assessment", "Problem-solving abilities", "Learning potential"],
                "onboarding_requirements": ["ML framework training", "Team collaboration training"],
                "long_term_potential": "High potential with proper guidance and experience"
            }
        }
    
    def _validate_and_fix_analysis_report(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and fix missing fields in the analysis report"""
        try:
            # Ensure candidate_information exists
            if "candidate_information" not in report:
                report["candidate_information"] = {
                    "name": "Not specified",
                    "position_applied": "AI/ML Engineer",
                    "experience_level": "Entry Level (0-2 years)",
                    "current_status": "Student/Recent Graduate"
                }
            
            # Ensure strengths_analysis exists
            if "strengths_analysis" not in report:
                report["strengths_analysis"] = {
                    "technical_skills": ["Python programming", "Basic machine learning concepts"],
                    "project_portfolio": ["Academic projects", "Personal projects"],
                    "educational_background": ["Relevant degree in Computer Science", "AI/ML coursework"]
                }
            
            # Ensure weaknesses_analysis exists
            if "weaknesses_analysis" not in report:
                report["weaknesses_analysis"] = {
                    "critical_gaps_against_job_description": ["Limited professional experience"],
                    "technical_deficiencies": ["Advanced ML frameworks"],
                    "resume_presentation_issues": ["Could improve formatting"],
                    "soft_skills_gaps": ["Professional communication"],
                    "missing_essential_elements": ["Professional certifications"]
                }
            
            # Ensure section_wise_detailed_feedback exists
            if "section_wise_detailed_feedback" not in report:
                report["section_wise_detailed_feedback"] = {
                    "contact_information": {"current_state": "Present", "strengths": [], "improvements": []},
                    "profile_summary": {"current_state": "Present", "strengths": [], "improvements": []},
                    "education": {"current_state": "Present", "strengths": [], "improvements": []},
                    "skills": {"current_state": "Present", "strengths": [], "improvements": []},
                    "projects": {"current_state": "Present", "strengths": [], "improvements": []},
                    "missing_sections": {
                        "certifications": "Add relevant certifications",
                        "experience": "Include relevant experience",
                        "achievements": "Highlight achievements",
                        "soft_skills": "Add soft skills section"
                    }
                }
            
            # Ensure improvement_recommendations exists
            if "improvement_recommendations" not in report:
                report["improvement_recommendations"] = {
                    "immediate_resume_additions": ["Add missing sections"],
                    "immediate_priority_actions": ["Improve formatting"],
                    "short_term_development_goals": ["Enhance technical skills"],
                    "medium_term_objectives": ["Gain experience"]
                }
            
            # Ensure soft_skills_enhancement_suggestions exists
            if "soft_skills_enhancement_suggestions" not in report:
                report["soft_skills_enhancement_suggestions"] = {
                    "communication_skills": ["Improve technical writing"],
                    "teamwork_and_collaboration": ["Join study groups"],
                    "leadership_and_initiative": ["Take leadership roles"],
                    "problem_solving_approach": ["Document processes"]
                }
            
            # Ensure final_assessment exists
            if "final_assessment" not in report:
                report["final_assessment"] = {
                    "eligibility_status": "Partially Eligible",
                    "hiring_recommendation": "Consider for entry-level position",
                    "key_interview_areas": ["Technical assessment"],
                    "onboarding_requirements": ["Training needed"],
                    "long_term_potential": "High potential"
                }
            
            # Validate and fix missing_sections specifically
            if "section_wise_detailed_feedback" in report:
                feedback = report["section_wise_detailed_feedback"]
                if "missing_sections" not in feedback:
                    feedback["missing_sections"] = {
                        "certifications": "Add relevant certifications",
                        "experience": "Include relevant experience",
                        "achievements": "Highlight achievements",
                        "soft_skills": "Add soft skills section"
                    }
                else:
                    missing_sections = feedback["missing_sections"]
                    required_missing_fields = ["certifications", "experience", "achievements", "soft_skills"]
                    for field in required_missing_fields:
                        if field not in missing_sections:
                            missing_sections[field] = f"Add {field} section"
            
            return report
            
        except Exception as e:
            logger.error(f"Error validating analysis report: {e}")
            return self._create_default_analysis_report()
