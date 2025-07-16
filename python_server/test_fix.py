#!/usr/bin/env python3
"""
Test script to verify the 422 error fix
"""

import requests
import json
import os

def test_resume_analysis():
    """Test the resume analysis endpoint with the provided data"""
    
    # API endpoint
    url = "http://localhost:8000/analyze-resume"
    
    # Job description from the user
    job_description = """We are seeking a motivated Junior AI/ML Engineer with 0-2 years of experience to join our innovative team, working on cutting-edge machine learning projects. In this role, you will assist in developing, testing, and deploying AI models to solve real-world problems, collaborating closely with senior engineers and data scientists.Your responsibilities will include data preprocessing, implementing machine learning algorithms using frameworks, like TensorFlow or PyTorch, and evaluating model performance to ensure accuracy and efficiency. Ideal candidates should have a strong foundation in Python, familiarity with data structures, and basic knowledge of supervised and unsupervised learning techniques. A degree in Computer Science, Data Science, or a related field is preferred, along with a passion for learning and staying updated with AI advancements."""
    
    # Resume file path
    resume_file_path = "../Smit Resume.pdf"
    
    if not os.path.exists(resume_file_path):
        print(f"❌ Resume file not found: {resume_file_path}")
        return
    
    try:
        # Prepare the request
        with open(resume_file_path, 'rb') as resume_file:
            files = {
                'resume_file': ('Smit Resume.pdf', resume_file, 'application/pdf')
            }
            data = {
                'job_description_text': job_description
            }
            
            print("🚀 Testing resume analysis...")
            print(f"📄 Resume: {resume_file_path}")
            print(f"📝 Job Description: {len(job_description)} characters")
            
            # Make the request
            response = requests.post(url, files=files, data=data, timeout=60)
            
            print(f"\n📊 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ SUCCESS! Analysis completed successfully")
                print(f"📈 Score: {result.get('score_out_of_100', 'N/A')}/100")
                print(f"🎯 Eligibility: {result.get('resume_eligibility', 'N/A')}")
                print(f"📋 Conclusion: {result.get('short_conclusion', 'N/A')[:100]}...")
                
                # Check if all required fields are present
                required_fields = [
                    'job_description_validity', 'resume_validity', 'resume_eligibility',
                    'score_out_of_100', 'short_conclusion', 'chance_of_selection_percentage',
                    'resume_improvement_priority', 'overall_fit_summary', 'resume_analysis_report'
                ]
                
                missing_fields = [field for field in required_fields if field not in result]
                if missing_fields:
                    print(f"⚠️  Missing fields: {missing_fields}")
                else:
                    print("✅ All required fields present")
                
            elif response.status_code == 422:
                error_data = response.json()
                print("❌ 422 Validation Error:")
                print(f"   Error: {error_data.get('error', 'Unknown')}")
                print(f"   Message: {error_data.get('message', 'No message')}")
                print(f"   Details: {error_data.get('details', 'No details')}")
                
            else:
                print(f"❌ Unexpected status code: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                    
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the server is running on http://localhost:8000")
    except requests.exceptions.Timeout:
        print("❌ Timeout Error: Request took too long")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    test_resume_analysis() 