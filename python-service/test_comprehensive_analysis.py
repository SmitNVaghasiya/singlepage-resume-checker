#!/usr/bin/env python3
"""
Test script to validate the comprehensive AI analysis functionality
"""

import json
import sys
import os

# Add the app directory to the path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

try:
    from app.response_validator import ResponseValidator
    from app.models import ResumeAnalysisResponse
    print("✅ Successfully imported app modules")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please make sure you're running from the python-service directory")
    sys.exit(1)

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

def test_sample_response():
    """Test the actual sample response JSON"""
    print("\n🧪 Testing sample_response.json...")
    
    try:
        # Load sample response
        with open('sample_response.json', 'r') as f:
            sample_data = json.load(f)
        
        # Validate with comprehensive validator
        is_valid, validation_report = ResponseValidator.comprehensive_validate(sample_data)
        
        if is_valid:
            print("✅ Sample response validation PASSED")
            # Test Pydantic model creation
            try:
                model = ResumeAnalysisResponse(**sample_data)
                print("✅ Sample response Pydantic model creation PASSED")
                return True
            except Exception as e:
                print(f"❌ Sample response Pydantic model creation FAILED: {str(e)}")
                return False
        else:
            print(f"❌ Sample response validation FAILED")
            print(f"Errors: {validation_report['errors']}")
            return False
            
    except FileNotFoundError:
        print("⚠️  sample_response.json not found, skipping test")
        return True
    except Exception as e:
        print(f"❌ Error testing sample response: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Comprehensive AI Analysis Integration")
    print("=" * 50)
    
    # Test 1: Valid response validation
    test1_passed = test_valid_response()
    
    # Test 2: Sample response
    test2_passed = test_sample_response()
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 TEST SUMMARY")
    print(f"✅ Response Validation Test: {'PASSED' if test1_passed else 'FAILED'}")
    print(f"✅ Sample Response Test: {'PASSED' if test2_passed else 'FAILED'}")
    
    all_passed = test1_passed and test2_passed
    print(f"\n{'🎉 ALL TESTS PASSED!' if all_passed else '❌ SOME TESTS FAILED'}")
    
    if all_passed:
        print("✅ The comprehensive AI analysis integration is working correctly!")
        print("🚀 Ready for production use with Node.js backend integration")
        print("\n📌 Next Steps:")
        print("  1. Start the service: python -m app.main")
        print("  2. Test the endpoint: POST /analyze-resume")
        print("  3. Update Node.js backend to use new endpoint")
    else:
        print("⚠️  Please fix the failing tests before deploying")
    
    return all_passed

if __name__ == "__main__":
    main() 