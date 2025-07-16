#!/usr/bin/env python3
"""
Debug test script to identify the exact cause of the 422 error
"""

import requests
import json
import os

def test_basic_upload():
    """Test basic file upload functionality"""
    print("🔍 Testing basic file upload...")
    
    url = "http://localhost:8000/test-upload"
    resume_file_path = "../Smit Resume.pdf"
    
    if not os.path.exists(resume_file_path):
        print(f"❌ Resume file not found: {resume_file_path}")
        return False
    
    try:
        with open(resume_file_path, 'rb') as resume_file:
            files = {
                'resume_file': ('Smit Resume.pdf', resume_file, 'application/pdf')
            }
            data = {
                'job_description_text': 'Test job description'
            }
            
            response = requests.post(url, files=files, data=data, timeout=30)
            
            print(f"📊 Test Upload Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Basic upload test successful")
                print(f"   Resume filename: {result.get('resume_filename')}")
                print(f"   Resume size: {result.get('resume_size')} bytes")
                print(f"   Job description length: {result.get('job_description_length')}")
                return True
            else:
                print(f"❌ Test upload failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Test upload error: {str(e)}")
        return False

def test_analyze_endpoint():
    """Test the actual analyze endpoint"""
    print("\n🔍 Testing analyze endpoint...")
    
    url = "http://localhost:8000/analyze-resume"
    resume_file_path = "../Smit Resume.pdf"
    
    if not os.path.exists(resume_file_path):
        print(f"❌ Resume file not found: {resume_file_path}")
        return False
    
    # Job description from the user
    job_description = """We are seeking a motivated Junior AI/ML Engineer with 0-2 years of experience to join our innovative team, working on cutting-edge machine learning projects. In this role, you will assist in developing, testing, and deploying AI models to solve real-world problems, collaborating closely with senior engineers and data scientists.Your responsibilities will include data preprocessing, implementing machine learning algorithms using frameworks, like TensorFlow or PyTorch, and evaluating model performance to ensure accuracy and efficiency. Ideal candidates should have a strong foundation in Python, familiarity with data structures, and basic knowledge of supervised and unsupervised learning techniques. A degree in Computer Science, Data Science, or a related field is preferred, along with a passion for learning and staying updated with AI advancements."""
    
    try:
        with open(resume_file_path, 'rb') as resume_file:
            files = {
                'resume_file': ('Smit Resume.pdf', resume_file, 'application/pdf')
            }
            data = {
                'job_description_text': job_description
            }
            
            print(f"📄 Resume: {resume_file_path}")
            print(f"📝 Job Description: {len(job_description)} characters")
            
            response = requests.post(url, files=files, data=data, timeout=60)
            
            print(f"📊 Analyze Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Analyze endpoint successful")
                print(f"📈 Score: {result.get('score_out_of_100', 'N/A')}/100")
                print(f"🎯 Eligibility: {result.get('resume_eligibility', 'N/A')}")
                return True
                
            elif response.status_code == 422:
                error_data = response.json()
                print("❌ 422 Validation Error:")
                print(f"   Error: {error_data.get('error', 'Unknown')}")
                print(f"   Message: {error_data.get('message', 'No message')}")
                print(f"   Details: {error_data.get('details', 'No details')}")
                return False
                
            else:
                print(f"❌ Unexpected status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Analyze endpoint error: {str(e)}")
        return False

def test_health_endpoint():
    """Test the health endpoint"""
    print("\n🔍 Testing health endpoint...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=10)
        print(f"📊 Health Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Health check successful")
            print(f"   Status: {result.get('status', 'Unknown')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting debug tests...")
    print("=" * 50)
    
    # Test 1: Health endpoint
    health_ok = test_health_endpoint()
    
    # Test 2: Basic upload
    upload_ok = test_basic_upload()
    
    # Test 3: Analyze endpoint
    analyze_ok = test_analyze_endpoint()
    
    print("\n" + "=" * 50)
    print("📋 Test Results Summary:")
    print(f"   Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"   Basic Upload: {'✅ PASS' if upload_ok else '❌ FAIL'}")
    print(f"   Analyze Endpoint: {'✅ PASS' if analyze_ok else '❌ FAIL'}")
    
    if not health_ok:
        print("\n💡 Issue: Server health check failed - server may not be running")
    elif not upload_ok:
        print("\n💡 Issue: Basic file upload failed - problem with file handling")
    elif not analyze_ok:
        print("\n💡 Issue: Analyze endpoint failed - problem with AI processing or validation")
    else:
        print("\n🎉 All tests passed! The system is working correctly.")

if __name__ == "__main__":
    main() 