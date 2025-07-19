#!/usr/bin/env python3
"""
Test script to verify the improvements work correctly.
Run this after starting the server to test the new features.
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the improved health check endpoint"""
    print("🔍 Testing health check...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health")
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed")
            print(f"   Status: {data.get('status')}")
            print(f"   Services: {list(data.get('services', {}).keys())}")
            print(f"   Rate limiting: {data.get('rate_limiting', {})}")
            print(f"   Validation limits: {data.get('validation_limits', {})}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_rate_limiting():
    """Test rate limiting by making multiple requests"""
    print("\n🚦 Testing rate limiting...")
    
    try:
        # Make multiple requests to trigger rate limiting
        for i in range(5):
            response = requests.get(f"{BASE_URL}/api/v1/health/simple")
            print(f"   Request {i+1}: {response.status_code}")
            
            # Check rate limit headers
            if 'X-RateLimit-Remaining' in response.headers:
                remaining = response.headers['X-RateLimit-Remaining']
                print(f"   Remaining requests: {remaining}")
            
            time.sleep(0.1)  # Small delay
        
        print("✅ Rate limiting test completed")
        return True
    except Exception as e:
        print(f"❌ Rate limiting test error: {e}")
        return False

def test_validation_limits():
    """Test input validation limits"""
    print("\n📏 Testing validation limits...")
    
    # Test with a very large job description
    large_job_desc = "Software Engineer " * 1000  # Very long job description
    
    try:
        # This should fail due to length validation
        response = requests.post(
            f"{BASE_URL}/api/v1/analyze",
            files={"resume": ("test.txt", b"This is a test resume content.")},
            data={"job_description_text": large_job_desc}
        )
        
        if response.status_code == 400:
            data = response.json()
            if "invalid_job_description_content" in data.get("error", ""):
                print("✅ Job description length validation working")
                return True
            else:
                print(f"❌ Unexpected validation error: {data}")
                return False
        else:
            print(f"❌ Expected 400 error, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Validation test error: {e}")
        return False

def test_error_handling():
    """Test standardized error handling"""
    print("\n⚠️  Testing error handling...")
    
    try:
        # Test with invalid endpoint
        response = requests.get(f"{BASE_URL}/api/v1/nonexistent")
        
        if response.status_code == 404:
            data = response.json()
            if data.get("error") == "not_found":
                print("✅ 404 error handling working")
                return True
            else:
                print(f"❌ Unexpected 404 error format: {data}")
                return False
        else:
            print(f"❌ Expected 404 error, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error handling test error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Python Server Improvements")
    print("=" * 50)
    
    tests = [
        test_health_check,
        test_rate_limiting,
        test_validation_limits,
        test_error_handling
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Improvements are working correctly.")
    else:
        print("⚠️  Some tests failed. Check the server logs for details.")

if __name__ == "__main__":
    main() 