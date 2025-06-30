import json
import re
import time
from typing import Dict, List, Optional, Tuple, Any
from groq import Groq
from loguru import logger
from .config import settings
from .models import AnalysisResult
import nltk
from nltk.corpus import stopwords
from collections import Counter

class ComprehensiveAIAnalyzer:
    def __init__(self):
        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is required")
        
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model
        
        # Initialize NLTK components
        try:
            nltk.download('stopwords', quiet=True)
            nltk.download('punkt', quiet=True)
            self.stop_words = set(stopwords.words('english'))
        except:
            self.stop_words = set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
        
        logger.info("Comprehensive AI Analyzer initialized")

    async def analyze_resume(
        self, 
        resume_text: str, 
        job_description_text: str
    ) -> AnalysisResult:
        """Perform comprehensive resume analysis using multiple AI prompts and analysis stages"""
        start_time = time.time()
        
        try:
            logger.info("Starting comprehensive resume analysis")
            
            # Stage 1: Extract job requirements and industry context
            job_analysis = await self._analyze_job_requirements(job_description_text)
            
            # Stage 2: Perform core resume analysis
            core_analysis = await self._perform_core_analysis(resume_text, job_description_text, job_analysis)
            
            # Stage 3: Analyze resume quality and structure
            quality_analysis = await self._analyze_resume_quality(resume_text)
            
            # Stage 4: Generate competitive analysis and positioning
            competitive_analysis = await self._generate_competitive_analysis(
                resume_text, job_description_text, core_analysis
            )
            
            # Stage 5: Create detailed improvement plan
            improvement_plan = await self._create_improvement_plan(
                resume_text, job_description_text, core_analysis, quality_analysis
            )
            
            # Stage 6: Generate final insights and recommendations
            final_insights = await self._generate_final_insights(
                resume_text, job_description_text, core_analysis, quality_analysis
            )
            
            # Combine all analyses into comprehensive result
            comprehensive_result = self._combine_analyses(
                job_analysis,
                core_analysis,
                quality_analysis,
                competitive_analysis,
                improvement_plan,
                final_insights,
                time.time() - start_time
            )
            
            logger.info(f"Comprehensive analysis completed in {time.time() - start_time:.2f} seconds")
            return comprehensive_result
            
        except Exception as e:
            logger.error(f"Error in comprehensive analysis: {e}")
            return self._create_fallback_analysis(job_description_text)

    async def _analyze_job_requirements(self, job_description_text: str) -> Dict[str, Any]:
        """Extract and analyze job requirements, industry, and key skills"""
        prompt = f"""
        Analyze the following job description and extract key information. Respond ONLY with valid JSON.

        Job Description:
        {job_description_text}

        Extract the following information in JSON format:
        {{
            "job_title": "extracted job title",
            "industry": "industry/field",
            "experience_required": "number of years or level (entry/mid/senior)",
            "technical_skills": ["list", "of", "technical", "skills"],
            "soft_skills": ["list", "of", "soft", "skills"],
            "required_qualifications": ["education", "certifications", "requirements"],
            "responsibilities": ["key", "job", "responsibilities"],
            "company_culture": ["culture", "keywords", "from", "description"],
            "keywords": ["important", "keywords", "for", "ats"],
            "salary_range": "if mentioned",
            "remote_options": "remote/hybrid/onsite",
            "industry_specific_requirements": ["industry", "specific", "needs"]
        }}
        """
        
        try:
            response = await self._get_ai_response(prompt, max_tokens=1500)
            return self._parse_json_response(response)
        except Exception as e:
            logger.error(f"Error analyzing job requirements: {e}")
            return self._get_default_job_analysis(job_description_text)

    async def _perform_core_analysis(
        self, 
        resume_text: str, 
        job_description_text: str, 
        job_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Perform core skills and experience matching analysis"""
        prompt = f"""
        You are a senior recruiter and talent acquisition specialist analyzing a resume against a job description for the role of {job_analysis.get('job_title', 'Professional')} in the {job_analysis.get('industry', 'General')} industry.

        CRITICAL INSTRUCTIONS:
        - Analyze EVERY section of the resume in detail
        - Compare EACH requirement from the job description against the resume
        - Provide specific examples and evidence from the resume
        - Be thorough and comprehensive in your analysis
        - Rate realistically but fairly
        - Focus on both what's present AND what's missing

        Job Description (Full Text):
        {job_description_text}

        Resume Content (Full Text):
        {resume_text}

        Required Technical Skills: {job_analysis.get('technical_skills', [])}
        Required Soft Skills: {job_analysis.get('soft_skills', [])}
        Experience Level Required: {job_analysis.get('experience_required', 'Not specified')}
        Industry: {job_analysis.get('industry', 'General')}

        Provide a comprehensive analysis in JSON format:
        {{
            "overall_score": 0-100,
            "match_percentage": 0-100,
            "keyword_analysis": {{
                "matched_keywords": ["specific", "keywords", "found", "in", "resume", "with", "context"],
                "missing_keywords": ["critical", "missing", "keywords", "from", "job", "description"],
                "ats_score": 0-100,
                "keyword_density": "analysis of keyword usage frequency",
                "keyword_suggestions": ["specific", "keywords", "to", "add", "with", "placement", "advice"],
                "industry_terminology": ["industry", "specific", "terms", "used", "correctly"]
            }},
            "skills_assessment": {{
                "technical_skills": {{
                    "present": ["skills", "explicitly", "mentioned", "or", "demonstrated"],
                    "missing": ["critical", "missing", "technical", "skills"],
                    "partially_matched": ["skills", "with", "some", "evidence", "but", "lacking", "depth"],
                    "recommendations": ["specific", "skills", "to", "develop", "with", "learning", "paths"],
                    "skill_level_analysis": ["assessment", "of", "proficiency", "levels", "shown"],
                    "certifications_mentioned": ["relevant", "certifications", "found"],
                    "tools_and_technologies": ["specific", "tools", "platforms", "mentioned"]
                }},
                "soft_skills": {{
                    "demonstrated": ["soft", "skills", "with", "specific", "examples"],
                    "missing": ["needed", "soft", "skills", "not", "demonstrated"],
                    "evidence": ["specific", "examples", "where", "soft", "skills", "are", "shown"],
                    "recommendations": ["actionable", "ways", "to", "demonstrate", "missing", "skills"],
                    "leadership_indicators": ["evidence", "of", "leadership", "or", "teamwork"],
                    "communication_skills": ["written", "and", "verbal", "communication", "evidence"]
                }},
                "industry_skills": {{
                    "relevant": ["industry", "specific", "skills", "and", "knowledge"],
                    "missing": ["industry", "specific", "gaps", "that", "need", "attention"],
                    "transferable": ["skills", "from", "other", "industries", "that", "apply"],
                    "domain_expertise": ["evidence", "of", "domain", "knowledge"]
                }}
            }},
            "experience_evaluation": {{
                "years_experience": "calculated total years",
                "relevant_years": "years of directly relevant experience",
                "experience_level": "entry/junior/mid/senior/executive",
                "relevant_experience": true/false,
                "experience_gaps": ["specific", "areas", "lacking", "experience"],
                "strength_areas": ["areas", "of", "strongest", "experience", "with", "details"],
                "career_progression": "detailed analysis of career growth pattern",
                "project_impact": ["specific", "evidence", "of", "measurable", "impact"],
                "role_responsibilities": ["analysis", "of", "responsibilities", "vs", "job", "requirements"],
                "achievements": ["quantified", "achievements", "and", "accomplishments"],
                "company_types": ["types", "of", "companies", "worked", "for"],
                "team_size_managed": "evidence of team leadership or management"
            }},
            "education_analysis": {{
                "degree_relevance": "how well education matches job requirements",
                "additional_certifications": ["relevant", "certifications", "or", "courses"],
                "continuous_learning": "evidence of ongoing education"
            }},
            "strengths": ["specific", "resume", "strengths", "with", "detailed", "explanations"],
            "weaknesses": ["detailed", "areas", "for", "improvement", "with", "specific", "examples"],
            "red_flags": ["potential", "concerns", "that", "employers", "might", "have"],
            "unique_value_props": ["what", "specifically", "makes", "this", "candidate", "stand", "out"],
            "cultural_fit_indicators": ["evidence", "of", "potential", "cultural", "fit"],
            "risk_assessment": ["potential", "risks", "in", "hiring", "this", "candidate"]
        }}
        """
        
        try:
            response = await self._get_ai_response(prompt, max_tokens=2500)
            return self._parse_json_response(response)
        except Exception as e:
            logger.error(f"Error in core analysis: {e}")
            return self._get_default_core_analysis()

    async def _analyze_resume_quality(self, resume_text: str) -> Dict[str, Any]:
        """Analyze resume formatting, structure, and content quality"""
        word_count = len(resume_text.split())
        
        prompt = f"""
        Analyze the quality and structure of this resume. Provide detailed feedback on formatting, content, and presentation.

        Resume Text:
        {resume_text}

        Word Count: {word_count}

        Analyze and respond in JSON format:
        {{
            "formatting_assessment": {{
                "score": 0-100,
                "issues": ["formatting", "problems"],
                "strengths": ["good", "formatting", "elements"],
                "suggestions": ["specific", "formatting", "improvements"]
            }},
            "content_quality": {{
                "score": 0-100,
                "clarity": 0-100,
                "specificity": 0-100,
                "quantified_achievements": 0-100,
                "action_words_usage": 0-100,
                "content_issues": ["content", "problems"],
                "content_strengths": ["strong", "content", "areas"]
            }},
            "structure_analysis": {{
                "score": 0-100,
                "sections_present": ["contact", "summary", "experience", "education", "skills"],
                "missing_sections": ["recommended", "missing", "sections"],
                "section_order": "assessment of section arrangement",
                "flow_and_readability": 0-100
            }},
            "length_assessment": {{
                "score": 0-100,
                "word_count": {word_count},
                "assessment": "too short/appropriate/too long",
                "recommendations": ["length", "suggestions"]
            }},
            "language_and_tone": {{
                "professionalism": 0-100,
                "consistency": 0-100,
                "grammar_issues": ["grammar", "concerns"],
                "tone_assessment": "professional/casual/mixed"
            }},
            "ats_compatibility": {{
                "score": 0-100,
                "ats_friendly_elements": ["good", "ats", "features"],
                "ats_issues": ["potential", "ats", "problems"],
                "recommendations": ["ats", "improvements"]
            }}
        }}
        """
        
        try:
            response = await self._get_ai_response(prompt, max_tokens=2000)
            return self._parse_json_response(response)
        except Exception as e:
            logger.error(f"Error in quality analysis: {e}")
            return self._get_default_quality_analysis(word_count)

    async def _generate_competitive_analysis(
        self, 
        resume_text: str, 
        job_description_text: str, 
        core_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate competitive positioning and market analysis"""
        overall_score = core_analysis.get('overall_score', 50)
        
        prompt = f"""
        Analyze this candidate's competitive position in the job market based on their resume and the target role.

        Current Overall Score: {overall_score}/100

        Resume:
        {resume_text}

        Job Requirements:
        {job_description_text}

        Provide competitive analysis in JSON format:
        {{
            "market_positioning": {{
                "strength_level": "weak/moderate/strong/exceptional",
                "percentile_ranking": "estimated percentile vs other candidates",
                "competitive_advantages": ["unique", "advantages"],
                "competitive_disadvantages": ["areas", "where", "others", "may", "be", "stronger"]
            }},
            "differentiators": {{
                "unique_experiences": ["standout", "experiences"],
                "rare_skills": ["uncommon", "valuable", "skills"],
                "achievements": ["notable", "accomplishments"],
                "value_proposition": "what makes this candidate special"
            }},
            "benchmark_comparison": {{
                "vs_entry_level": "how they compare to entry candidates",
                "vs_experienced": "how they compare to experienced candidates",
                "vs_ideal_candidate": "gaps compared to perfect candidate"
            }},
            "improvement_impact": {{
                "high_impact_changes": ["changes", "with", "biggest", "impact"],
                "score_improvement_potential": "potential score increase",
                "market_position_improvement": "how position could improve"
            }}
        }}
        """
        
        try:
            response = await self._get_ai_response(prompt, max_tokens=1500)
            return self._parse_json_response(response)
        except Exception as e:
            logger.error(f"Error in competitive analysis: {e}")
            return self._get_default_competitive_analysis(overall_score)

    async def _create_improvement_plan(
        self, 
        resume_text: str, 
        job_description_text: str, 
        core_analysis: Dict[str, Any], 
        quality_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a detailed, actionable improvement plan"""
        prompt = f"""
        Create a comprehensive improvement plan for this resume based on the analysis results.

        Current Scores:
        - Overall: {core_analysis.get('overall_score', 50)}/100
        - Content Quality: {quality_analysis.get('content_quality', {}).get('score', 50)}/100
        - ATS Compatibility: {quality_analysis.get('ats_compatibility', {}).get('score', 50)}/100

        Resume:
        {resume_text}

        Target Job:
        {job_description_text}

        Create a detailed, actionable improvement plan in JSON format:
        {{
            "immediate_actions": [
                {{
                    "priority": "high/medium/low",
                    "action": "specific, actionable step to take immediately",
                    "why": "detailed explanation of why this is important and its business impact",
                    "estimated_impact": "specific score improvement expected (e.g., +5-10 points)",
                    "time_required": "realistic time estimate to complete",
                    "difficulty": "easy/medium/hard",
                    "how_to": "step-by-step instructions on how to implement",
                    "success_metrics": "how to measure if this was successful"
                }}
            ],
            "short_term_improvements": [
                {{
                    "priority": "high/medium/low",
                    "action": "specific improvement goal for 1-3 months",
                    "why": "strategic rationale and connection to job requirements",
                    "estimated_impact": "detailed impact description on candidacy",
                    "time_required": "realistic time estimate",
                    "resources_needed": ["specific", "resources", "tools", "courses", "needed"],
                    "milestones": ["key", "checkpoints", "along", "the", "way"],
                    "potential_obstacles": ["challenges", "to", "anticipate"],
                    "success_criteria": "clear definition of successful completion"
                }}
            ],
            "long_term_development": [
                {{
                    "priority": "high/medium/low",
                    "action": "strategic long-term development goal",
                    "why": "strategic career importance and market positioning",
                    "estimated_impact": "comprehensive career impact description",
                    "timeline": "realistic timeline (6+ months)",
                    "investment_required": "detailed time/money/effort investment",
                    "career_benefits": ["specific", "career", "advantages", "this", "will", "provide"],
                    "alternative_paths": ["different", "approaches", "to", "achieve", "same", "goal"],
                    "roi_analysis": "return on investment for career growth"
                }}
            ],
            "quick_wins": [
                {{
                    "action": "immediate, easy fix that can be done today",
                    "impact": "specific immediate benefit to resume or candidacy",
                    "time": "realistic time requirement (under 2 hours)",
                    "tools_needed": ["any", "tools", "or", "resources", "required"],
                    "before_after": "what changes and how it looks different"
                }}
            ],
            "skill_development_roadmap": [
                {{
                    "skill": "specific skill to develop",
                    "current_level": "beginner/intermediate/advanced",
                    "target_level": "target proficiency level",
                    "learning_path": ["step1", "step2", "step3"],
                    "recommended_resources": ["courses", "books", "practice", "projects"],
                    "timeline": "realistic development timeline"
                }}
            ]
        }}
        """
        
        try:
            response = await self._get_ai_response(prompt, max_tokens=2500)
            return self._parse_json_response(response)
        except Exception as e:
            logger.error(f"Error creating improvement plan: {e}")
            return self._get_default_improvement_plan()

    async def _generate_final_insights(
        self, 
        resume_text: str, 
        job_description_text: str, 
        core_analysis: Dict[str, Any], 
        quality_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate final AI insights and comprehensive recommendations"""
        prompt = f"""
        As a senior career consultant and hiring expert, provide comprehensive final insights and strategic recommendations for this resume analysis.

        ANALYSIS SUMMARY:
        - Overall Match Score: {core_analysis.get('overall_score', 50)}/100
        - Resume Quality Score: {quality_analysis.get('content_quality', {}).get('score', 50)}/100
        - ATS Compatibility: {quality_analysis.get('ats_compatibility', {}).get('score', 50)}/100
        - Formatting Score: {quality_analysis.get('formatting_assessment', {}).get('score', 50)}/100

        CONTEXT FOR INSIGHTS:
        - Target Role: Based on job description analysis
        - Candidate Strengths: {core_analysis.get('strengths', [])}
        - Major Weaknesses: {core_analysis.get('weaknesses', [])}
        - Industry Context: Consider current market trends and demands

        Generate comprehensive final insights in JSON format:
        {{
            "overall_recommendation": "detailed 3-4 sentence recommendation covering hiring decision, key strengths, major concerns, and strategic advice",
            "executive_summary": "2-3 sentence executive summary for quick decision making",
            "confidence_level": 0-100,
            "hiring_likelihood": "low/moderate/high/excellent",
            "interview_readiness": 0-100,
            "salary_positioning": "below/at/above market rate based on profile",
            "ai_insights": [
                "detailed insight about resume's competitive positioning",
                "specific insight about improvement areas with business impact",
                "market positioning insight relative to other candidates",
                "strategic career advice for long-term success",
                "insight about cultural fit potential",
                "assessment of growth potential and scalability"
            ],
            "industry_specific_advice": [
                "specific advice for this industry/role",
                "current industry trends to leverage",
                "emerging skills or technologies to consider",
                "industry networking or positioning recommendations"
            ],
            "next_steps": [
                "immediate action item (within 1 week)",
                "short-term improvement goal (1-3 months)",
                "medium-term career development step (3-6 months)",
                "long-term strategic career move (6+ months)"
            ],
            "success_factors": [
                "primary factor that will drive success in this role",
                "secondary success factor to focus on",
                "potential differentiator to develop",
                "risk factor to mitigate"
            ],
            "interview_preparation": [
                "key strength to emphasize in interviews",
                "weakness to address proactively",
                "specific examples or stories to prepare",
                "questions candidate should ask"
            ],
            "market_comparison": "how this candidate compares to typical market candidates for this role"
        }}
        """
        
        try:
            response = await self._get_ai_response(prompt, max_tokens=1500)
            return self._parse_json_response(response)
        except Exception as e:
            logger.error(f"Error generating final insights: {e}")
            return self._get_default_insights()

    def _combine_analyses(
        self, 
        job_analysis: Dict[str, Any],
        core_analysis: Dict[str, Any],
        quality_analysis: Dict[str, Any],
        competitive_analysis: Dict[str, Any],
        improvement_plan: Dict[str, Any],
        final_insights: Dict[str, Any],
        processing_time: float
    ) -> AnalysisResult:
        """Combine all analysis results into the comprehensive AnalysisResult format"""
        
        # Extract keyword analysis
        keyword_data = core_analysis.get('keyword_analysis', {})
        
        # Extract skills analysis
        skills_data = core_analysis.get('skills_assessment', {})
        
        # Extract experience analysis
        exp_data = core_analysis.get('experience_evaluation', {})
        
        # Extract quality analysis
        quality_data = quality_analysis
        
        # Extract competitive analysis
        competitive_data = competitive_analysis.get('market_positioning', {})
        
        # Build comprehensive result with all enhanced fields
        return AnalysisResult(
            # Core compatibility scores
            score=float(core_analysis.get('overall_score', 50)),
            
            # Legacy fields for backward compatibility
            strengths=core_analysis.get('strengths', []),
            weaknesses=core_analysis.get('weaknesses', []),
            suggestions=self._extract_suggestions_from_improvement_plan(improvement_plan),
            
            # Basic analysis fields
            keyword_match={
                'matched': keyword_data.get('matched_keywords', []),
                'missing': keyword_data.get('missing_keywords', []),
                'percentage': float(keyword_data.get('ats_score', 0)),
                'suggestions': keyword_data.get('keyword_suggestions', [])
            },
            
            skills_analysis={
                'technical': {
                    'required': skills_data.get('technical_skills', {}).get('missing', []),
                    'present': skills_data.get('technical_skills', {}).get('present', []),
                    'missing': skills_data.get('technical_skills', {}).get('missing', []),
                    'recommendations': skills_data.get('technical_skills', {}).get('recommendations', [])
                },
                'soft': {
                    'required': skills_data.get('soft_skills', {}).get('missing', []),
                    'present': skills_data.get('soft_skills', {}).get('demonstrated', []),
                    'missing': skills_data.get('soft_skills', {}).get('missing', []),
                    'recommendations': skills_data.get('soft_skills', {}).get('recommendations', [])
                },
                'industry': {
                    'required': skills_data.get('industry_skills', {}).get('missing', []),
                    'present': skills_data.get('industry_skills', {}).get('relevant', []),
                    'missing': skills_data.get('industry_skills', {}).get('missing', []),
                    'recommendations': []
                }
            },
            
            experience_analysis={
                'years_required': self._extract_years(job_analysis.get('experience_required', '0')),
                'years_found': self._extract_years(exp_data.get('years_experience', '0')),
                'relevant': exp_data.get('relevant_experience', True),
                'experience_gaps': exp_data.get('experience_gaps', []),
                'strength_areas': exp_data.get('strength_areas', []),
                'improvement_areas': exp_data.get('improvement_areas', [])
            },
            
            overall_recommendation=final_insights.get('overall_recommendation', 'Analysis completed successfully.'),
            
            # Enhanced comprehensive analysis fields
            overall_score=float(core_analysis.get('overall_score', 50)),
            match_percentage=float(core_analysis.get('match_percentage', core_analysis.get('overall_score', 50))),
            job_title=job_analysis.get('job_title', 'Professional Position'),
            industry=job_analysis.get('industry', 'General'),
            
            resume_quality={
                'formatting': {
                    'score': quality_data.get('formatting_assessment', {}).get('score', 70),
                    'issues': quality_data.get('formatting_assessment', {}).get('issues', []),
                    'suggestions': quality_data.get('formatting_assessment', {}).get('suggestions', [])
                },
                'content': {
                    'score': quality_data.get('content_quality', {}).get('score', 70),
                    'issues': quality_data.get('content_quality', {}).get('content_issues', []),
                    'suggestions': quality_data.get('content_quality', {}).get('content_strengths', [])
                },
                'length': {
                    'score': quality_data.get('length_assessment', {}).get('score', 70),
                    'wordCount': quality_data.get('length_assessment', {}).get('word_count', 0),
                    'recommendations': quality_data.get('length_assessment', {}).get('recommendations', [])
                },
                'structure': {
                    'score': quality_data.get('structure_analysis', {}).get('score', 70),
                    'missingSections': quality_data.get('structure_analysis', {}).get('missing_sections', []),
                    'suggestions': quality_data.get('structure_analysis', {}).get('suggestions', [])
                }
            },
            
            competitive_analysis={
                'positioning_strength': min(int(core_analysis.get('overall_score', 50)) + 10, 100),
                'competitor_comparison': competitive_data.get('competitive_advantages', []),
                'differentiators': competitive_analysis.get('differentiators', {}).get('unique_experiences', []),
                'market_position': competitive_data.get('strength_level', 'moderate'),
                'improvement_impact': competitive_analysis.get('improvement_impact', {}).get('high_impact_changes', [])
            },
            
            detailed_feedback={
                'strengths': [
                    {
                        'category': 'General',
                        'points': core_analysis.get('strengths', []),
                        'impact': 'Positive impact on application'
                    }
                ],
                'weaknesses': [
                    {
                        'category': 'General',
                        'points': core_analysis.get('weaknesses', []),
                        'impact': 'May reduce application effectiveness',
                        'solutions': core_analysis.get('suggestions', [])
                    }
                ],
                'quick_wins': improvement_plan.get('quick_wins', []),
                'industry_insights': final_insights.get('industry_specific_advice', [])
            },
            
            improvement_plan={
                'immediate': self._format_improvement_items(improvement_plan.get('immediate_actions', [])),
                'short_term': self._format_improvement_items(improvement_plan.get('short_term_improvements', [])),
                'long_term': self._format_improvement_items(improvement_plan.get('long_term_development', []))
            },
            
            ai_insights=final_insights.get('ai_insights', [
                'Analysis completed using advanced AI algorithms',
                'Recommendations are based on industry best practices',
                'Consider implementing high-priority suggestions first'
            ]),
            
            candidate_strengths=core_analysis.get('unique_value_props', core_analysis.get('strengths', [])),
            development_areas=core_analysis.get('weaknesses', []),
            confidence=float(final_insights.get('confidence_level', 85)),
            processing_time=processing_time
        )
    
    def _extract_suggestions_from_improvement_plan(self, improvement_plan: Dict[str, Any]) -> List[str]:
        """Extract suggestions from improvement plan for backward compatibility"""
        suggestions = []
        
        # Extract immediate actions
        for item in improvement_plan.get('immediate_actions', []):
            if isinstance(item, dict) and 'action' in item:
                suggestions.append(item['action'])
            elif isinstance(item, str):
                suggestions.append(item)
        
        # Extract quick wins
        for item in improvement_plan.get('quick_wins', []):
            if isinstance(item, dict) and 'action' in item:
                suggestions.append(item['action'])
            elif isinstance(item, str):
                suggestions.append(item)
        
        return suggestions[:10]  # Limit to 10 suggestions
    
    def _format_improvement_items(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format improvement items for the comprehensive structure"""
        formatted_items = []
        
        for item in items:
            if isinstance(item, dict):
                formatted_items.append({
                    'priority': item.get('priority', 'medium'),
                    'actions': [item.get('action', '')] if item.get('action') else [],
                    'estimated_impact': item.get('estimated_impact', item.get('impact', ''))
                })
            else:
                formatted_items.append({
                    'priority': 'medium',
                    'actions': [str(item)],
                    'estimated_impact': 'Moderate improvement expected'
                })
        
        return formatted_items

    async def _get_ai_response(self, prompt: str, max_tokens: int = 2000) -> str:
        """Get response from Groq AI with error handling and retries"""
        max_retries = 3
        retry_delay = 1
        
        # Add timestamp to prompt for uniqueness
        timestamp = time.time()
        enhanced_prompt = f"{prompt}\n\nAnalysis ID: {timestamp} - Provide a unique, comprehensive analysis."
        
        for attempt in range(max_retries):
            try:
                # Use slightly higher temperature for more varied responses
                temperature = 0.4 + (timestamp % 1000) / 10000  # Range: 0.4-0.5
                
                chat_completion = self.client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": f"You are an expert HR professional and resume analyst with {10 + int(timestamp % 10)} years of experience. Always respond with valid JSON when requested. Be detailed, accurate, and actionable in your analysis. Each analysis should be comprehensive and unique, providing specific insights based on the resume content and job requirements. Current analysis timestamp: {timestamp}"
                        },
                        {
                            "role": "user",
                            "content": enhanced_prompt
                        }
                    ],
                    model=self.model,
                    temperature=temperature,
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

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON response with fallback handling"""
        try:
            # Clean the response
            cleaned_response = response.strip()
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith('```'):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()
            
            # Parse JSON
            return json.loads(cleaned_response)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response content: {response}")
            return {}

    def _extract_years(self, text: str) -> int:
        """Extract years of experience from text"""
        if isinstance(text, int):
            return text
        
        text = str(text).lower()
        
        # Look for patterns like "5 years", "3-5 years", "5+ years"
        year_patterns = [
            r'(\d+)\+?\s*years?',
            r'(\d+)-\d+\s*years?',
            r'(\d+)',
        ]
        
        for pattern in year_patterns:
            match = re.search(pattern, text)
            if match:
                return int(match.group(1))
        
        # Experience level mappings
        level_mapping = {
            'entry': 0,
            'junior': 1,
            'mid': 3,
            'senior': 5,
            'lead': 7,
            'principal': 10,
            'director': 12
        }
        
        for level, years in level_mapping.items():
            if level in text:
                return years
        
        return 0

    def _create_fallback_analysis(self, job_description: str) -> AnalysisResult:
        """Create fallback analysis when AI processing fails"""
        logger.warning("Creating fallback analysis due to processing failure")
        
        return AnalysisResult(
            score=50.0,
            strengths=["Resume submitted for analysis"],
            weaknesses=["Unable to perform detailed analysis due to processing error"],
            suggestions=["Please try again or contact support"],
            keyword_match={'matched': [], 'missing': [], 'percentage': 0.0},
            skills_analysis={'required': [], 'present': [], 'missing': []},
            experience_analysis={'years_required': 0, 'years_found': 0, 'relevant': False},
            overall_recommendation="Analysis could not be completed due to technical issues. Please try again."
        )

    # Default analysis methods for fallbacks
    def _get_default_job_analysis(self, job_description: str) -> Dict[str, Any]:
        """Generate basic job analysis when AI fails"""
        return {
            "job_title": "Professional Position",
            "industry": "General",
            "experience_required": "2-5 years",
            "technical_skills": [],
            "soft_skills": ["communication", "teamwork", "problem-solving"],
            "required_qualifications": [],
            "responsibilities": [],
            "company_culture": [],
            "keywords": [],
            "salary_range": "Not specified",
            "remote_options": "Not specified",
            "industry_specific_requirements": []
        }

    def _get_default_core_analysis(self) -> Dict[str, Any]:
        return {
            "overall_score": 50,
            "match_percentage": 50,
            "keyword_analysis": {
                "matched_keywords": [],
                "missing_keywords": [],
                "ats_score": 50,
                "keyword_suggestions": []
            },
            "skills_assessment": {
                "technical_skills": {"present": [], "missing": [], "recommendations": []},
                "soft_skills": {"demonstrated": [], "missing": [], "recommendations": []},
                "industry_skills": {"relevant": [], "missing": []}
            },
            "experience_evaluation": {
                "years_experience": "0",
                "relevant_experience": True,
                "experience_gaps": [],
                "strength_areas": []
            },
            "strengths": ["Resume analysis attempted"],
            "weaknesses": ["Analysis incomplete"],
            "unique_value_props": []
        }

    def _get_default_quality_analysis(self, word_count: int) -> Dict[str, Any]:
        return {
            "formatting_assessment": {"score": 60, "issues": [], "suggestions": []},
            "content_quality": {"score": 60, "content_issues": [], "content_strengths": []},
            "structure_analysis": {"score": 60, "missing_sections": [], "sections_present": []},
            "length_assessment": {"score": 60, "word_count": word_count, "recommendations": []},
            "ats_compatibility": {"score": 60, "ats_issues": [], "recommendations": []}
        }

    def _get_default_competitive_analysis(self, score: int) -> Dict[str, Any]:
        return {
            "market_positioning": {"strength_level": "moderate", "competitive_advantages": []},
            "differentiators": {"unique_experiences": [], "value_proposition": "Standard candidate profile"},
            "improvement_impact": {"high_impact_changes": [], "score_improvement_potential": "10-20 points"}
        }

    def _get_default_improvement_plan(self) -> Dict[str, Any]:
        return {
            "immediate_actions": [],
            "short_term_improvements": [],
            "long_term_development": [],
            "quick_wins": []
        }

    def _get_default_insights(self) -> Dict[str, Any]:
        return {
            "overall_recommendation": "Resume requires improvement for better market positioning.",
            "confidence_level": 70,
            "ai_insights": ["Analysis completed with limited data"],
            "next_steps": ["Review and improve resume content"]
        }

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

# Global analyzer instance
ai_analyzer = ComprehensiveAIAnalyzer() 