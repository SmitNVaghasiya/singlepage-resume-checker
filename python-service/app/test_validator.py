#!/usr/bin/env python3
"""
Test script to validate the ResponseValidator is working correctly for the merged python-service
"""

import json
import sys
import os
import asyncio

from .response_validator import ResponseValidator
from .models import ResumeAnalysisResponse

def test_valid_response():
    """Test with a valid response structure"""
    print("🧪 Testing with VALID response structure...")
    
    valid_response = {
        "job_description_validity": "Valid",
        "resume_eligibility": "Eligible", 
        "score_out_of_100": 77,
        "short_conclusion": "Candidate is a promising fit for the role with some room for polish.",
        "chance_of_selection_percentage": 70,
        "resume_improvement_priority": [
            "Add TensorFlow or PyTorch experience to resume",
            "Fix grammar and formatting issues",
            "Add GitHub links to projects",
            "Include specific technical details in AI/ML projects"
        ],
        "overall_fit_summary": "Resume shows strong Python foundation and genuine AI/ML interest with practical projects.",
        "resume_analysis_report": {
            "candidate_information": {
                "name": "Test Candidate",
                "position_applied": "Junior AI/ML Engineer",
                "experience_level": "Entry Level (0-2 years)",
                "current_status": "B.Tech Student (Expected 2026)"
            },
            "strengths_analysis": {
                "technical_skills": ["Strong Python programming", "AI project experience"],
                "project_portfolio": ["Diverse portfolio", "Real AI applications"],
                "educational_background": ["AI specialization", "Strong foundation"]
            },
            "weaknesses_analysis": {
                "critical_gaps_against_job_description": ["Missing framework experience"],
                "technical_deficiencies": ["Limited data science libraries"],
                "resume_presentation_issues": ["Formatting inconsistencies"],
                "soft_skills_gaps": ["Communication skills not highlighted"],
                "missing_essential_elements": ["No GitHub links", "Missing certifications"]
            },
            "section_wise_detailed_feedback": {
                "contact_information": {
                    "current_state": "Complete contact information provided",
                    "strengths": ["Professional email", "LinkedIn profile"],
                    "improvements": ["Add GitHub profile", "Include portfolio website"]
                },
                "profile_summary": {
                    "current_state": "Brief overview highlighting skills",
                    "strengths": ["Shows technical focus", "Demonstrates passion"],
                    "improvements": ["Add quantifiable outcomes", "Include soft skills"]
                },
                "education": {
                    "current_state": "Strong educational progression",
                    "strengths": ["Relevant specialization", "Clear progression"],
                    "improvements": ["Add GPA if strong", "Include coursework"]
                },
                "skills": {
                    "current_state": "Basic programming languages listed",
                    "strengths": ["Python prominence", "Honest indicators"],
                    "improvements": ["Add ML frameworks", "Include data science libraries"]
                },
                "projects": {
                    "current_state": "Multiple projects showing versatility",
                    "strengths": ["Good variety", "Real-world problem solving"],
                    "improvements": ["Specify frameworks used", "Add performance metrics"]
                },
                "missing_sections": {
                    "certifications": "Add AI/ML certifications and courses",
                    "experience": "Include internships or freelance work",
                    "achievements": "Add competitions or recognitions",
                    "soft_skills": "Dedicated section for communication and teamwork"
                }
            },
            "improvement_recommendations": {
                "immediate_resume_additions": ["Add specific frameworks", "Include GitHub links"],
                "immediate_priority_actions": ["Fix formatting", "Add quantifiable results"], 
                "short_term_development_goals": ["Learn frameworks", "Build portfolio"],
                "medium_term_objectives": ["Gain experience", "Obtain certifications"]
            },
            "soft_skills_enhancement_suggestions": {
                "communication_skills": ["Add presentation experience", "Include documentation"],
                "teamwork_and_collaboration": ["Highlight group projects", "Show collaboration"],
                "leadership_and_initiative": ["Document leadership roles", "Show initiative"],
                "problem_solving_approach": ["Describe methodology", "Show problem-solving"]
            },
            "final_assessment": {
                "eligibility_status": "Qualified with Development Needs",
                "hiring_recommendation": "Recommend for interview with focus on potential",
                "key_interview_areas": ["Technical skills", "Learning ability", "Communication"],
                "onboarding_requirements": ["Mentorship program", "Technical training"],
                "long_term_potential": "High potential with proper guidance and training"
            }
        }
    }
    
    is_valid, validation_report = ResponseValidator.comprehensive_validate(valid_response)
    
    print(f"✅ Validation Result: {'PASSED' if is_valid else 'FAILED'}")
    print(f"📊 Summary: {validation_report['summary']}")
    
    if validation_report['warnings']:
        print(f"⚠️  Warnings: {validation_report['warnings']}")
    
    if not is_valid:
        print(f"❌ Errors: {validation_report['errors']}")
    
    return is_valid

def test_invalid_response():
    """Test with an invalid response structure"""
    print("\n🧪 Testing with INVALID response structure...")
    
    invalid_response = {
        "job_description_validity": "Maybe",  # Invalid value
        "resume_eligibility": "Eligible",
        "score_out_of_100": 150,  # Invalid range
        "short_conclusion": "Good candidate",
        # Missing chance_of_selection_percentage
        "resume_improvement_priority": [],  # Empty array
        "overall_fit_summary": "Good fit",
        "resume_analysis_report": {
            "candidate_information": {
                "name": "Test Candidate",
                # Missing other required fields
            },
            # Missing other required sections
        }
    }
    
    is_valid, validation_report = ResponseValidator.comprehensive_validate(invalid_response)
    
    print(f"❌ Validation Result: {'PASSED' if is_valid else 'FAILED (as expected)'}")
    print(f"📊 Summary: {validation_report['summary']}")
    print(f"🔍 Sample Errors: {validation_report['errors'][:3]}...")  # Show first 3 errors
    
    return not is_valid  # Should return True if validation correctly failed

def test_pydantic_model():
    """Test if a valid response can create Pydantic model"""
    print("\n🧪 Testing Pydantic model creation...")
    
    valid_data = {
        "job_description_validity": "Valid",
        "resume_eligibility": "Eligible",
        "score_out_of_100": 85,
        "short_conclusion": "Strong candidate with good potential.",
        "chance_of_selection_percentage": 80,
        "resume_improvement_priority": ["Improve formatting", "Add more technical details"],
        "overall_fit_summary": "Good technical background with room for improvement",
        "resume_analysis_report": {
            "candidate_information": {
                "name": "John Doe",
                "position_applied": "Software Developer",
                "experience_level": "Mid Level",
                "current_status": "Employed"
            },
            "strengths_analysis": {
                "technical_skills": ["Python", "JavaScript"],
                "project_portfolio": ["Web applications", "API development"],
                "educational_background": ["Computer Science degree"]
            },
            "weaknesses_analysis": {
                "critical_gaps_against_job_description": ["Missing cloud experience"],
                "technical_deficiencies": ["Limited testing knowledge"],
                "resume_presentation_issues": ["Poor formatting"],
                "soft_skills_gaps": ["Communication needs work"],
                "missing_essential_elements": ["No certifications"]
            },
            "section_wise_detailed_feedback": {
                "contact_information": {
                    "current_state": "Complete",
                    "strengths": ["Professional email"],
                    "improvements": ["Add LinkedIn"]
                },
                "profile_summary": {
                    "current_state": "Adequate",
                    "strengths": ["Clear objectives"],
                    "improvements": ["More specific"]
                },
                "education": {
                    "current_state": "Good",
                    "strengths": ["Relevant degree"],
                    "improvements": ["Add GPA"]
                },
                "skills": {
                    "current_state": "Basic",
                    "strengths": ["Core languages"],
                    "improvements": ["Add frameworks"]
                },
                "projects": {
                    "current_state": "Decent",
                    "strengths": ["Practical examples"],
                    "improvements": ["Add metrics"]
                },
                "missing_sections": {
                    "certifications": "Add technical certifications",
                    "experience": "More detailed experience section",
                    "achievements": "Add notable achievements",
                    "soft_skills": "Highlight communication skills"
                }
            },
            "improvement_recommendations": {
                "immediate_resume_additions": ["Add LinkedIn profile"],
                "immediate_priority_actions": ["Fix formatting issues"],
                "short_term_development_goals": ["Learn cloud technologies"],
                "medium_term_objectives": ["Obtain cloud certifications"]
            },
            "soft_skills_enhancement_suggestions": {
                "communication_skills": ["Practice presentations"],
                "teamwork_and_collaboration": ["Join team projects"],
                "leadership_and_initiative": ["Take on leadership roles"],
                "problem_solving_approach": ["Document problem-solving process"]
            },
            "final_assessment": {
                "eligibility_status": "Qualified",
                "hiring_recommendation": "Recommend for technical interview",
                "key_interview_areas": ["Technical skills", "Problem solving"],
                "onboarding_requirements": ["Cloud training", "Team integration"],
                "long_term_potential": "Good growth potential"
            }
        }
    }
    
    try:
        model = ResumeAnalysisResponse(**valid_data)
        print("✅ Pydantic model created successfully")
        print(f"📝 Model score: {model.score_out_of_100}")
        return True
    except Exception as e:
        print(f"❌ Pydantic model creation failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 Running Comprehensive Response Validator Tests for Python Service")
    print("=" * 70)
    
    # Test 1: Valid response
    test1_passed = test_valid_response()
    
    # Test 2: Invalid response  
    test2_passed = test_invalid_response()
    
    # Test 3: Pydantic model creation
    test3_passed = test_pydantic_model()
    
    # Summary
    print("\n" + "=" * 70)
    print("📋 TEST SUMMARY")
    print(f"✅ Valid Response Test: {'PASSED' if test1_passed else 'FAILED'}")
    print(f"✅ Invalid Response Test: {'PASSED' if test2_passed else 'FAILED'}")
    print(f"✅ Pydantic Model Test: {'PASSED' if test3_passed else 'FAILED'}")
    
    all_passed = test1_passed and test2_passed and test3_passed
    print(f"\n{'🎉 ALL TESTS PASSED!' if all_passed else '❌ SOME TESTS FAILED'}")
    
    if all_passed:
        print("✅ The comprehensive AI analysis integration is working correctly!")
        print("🚀 Ready for production use with Node.js backend integration")
    else:
        print("⚠️  Please fix the failing tests before deploying")
    
    return all_passed

if __name__ == "__main__":
    main() 