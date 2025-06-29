#!/usr/bin/env python3
"""
Startup script for Resume Analyzer Python Service (FastAPI)
Checks dependencies and starts the FastAPI server
"""

import sys
import os
import subprocess
import importlib.util

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version.split()[0]}")
    return True

def check_virtual_env():
    """Check if virtual environment is activated"""
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("✅ Virtual environment is activated")
        return True
    else:
        print("⚠️  Virtual environment not detected")
        print("   Consider activating virtual environment for better isolation")
        return True  # Don't fail, just warn

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        'fastapi',
        'uvicorn',
        'PyPDF2',
        'docx'  # python-docx imports as 'docx'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        spec = importlib.util.find_spec(package)
        if spec is None:
            missing_packages.append(package)
        else:
            print(f"✅ {package} is installed")
    
    if missing_packages:
        print(f"❌ Missing packages: {', '.join(missing_packages)}")
        print("   Install with: pip install fastapi uvicorn PyPDF2 python-docx")
        return False
    
    return True

def check_files():
    """Check if required files exist"""
    required_files = ['fastapi_app.py']
    
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file} found")
        else:
            print(f"❌ {file} not found")
            return False
    
    return True

def start_fastapi_server():
    """Start the FastAPI server"""
    print("\n🚀 Starting FastAPI Resume Analyzer Service...")
    print("   Server will be available at: http://localhost:8000")
    print("   Health check: http://localhost:8000/health")
    print("   API Documentation: http://localhost:8000/docs")
    print("   Press Ctrl+C to stop the server\n")
    
    try:
        # Start FastAPI app using uvicorn
        subprocess.run([
            sys.executable, '-m', 'uvicorn', 
            'fastapi_app:app', 
            '--host', '0.0.0.0', 
            '--port', '8000', 
            '--reload'
        ], check=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start server: {e}")
        return False
    except FileNotFoundError:
        print("❌ Python executable not found")
        return False
    
    return True

def show_usage_info():
    """Show usage information"""
    print("\n📖 Usage Information:")
    print("   1. Health Check: GET http://localhost:8000/health")
    print("   2. API Documentation: GET http://localhost:8000/docs")
    print("   3. Analyze Resume: POST http://localhost:8000/analyze")
    print("      - Form data: 'resume' file and optional 'job_description' text")
    print("      - Supported formats: PDF, DOCX, TXT")
    print("      - Max file size: 10MB")
    print("\n📚 Documentation: See README.md for detailed API documentation")

def main():
    """Main startup function"""
    print("🔍 Resume Analyzer Python Service - Startup Check (FastAPI)")
    print("=" * 60)
    
    # Check system requirements
    checks = [
        ("Python Version", check_python_version),
        ("Virtual Environment", check_virtual_env),
        ("Dependencies", check_dependencies),
        ("Required Files", check_files),
    ]
    
    all_passed = True
    for check_name, check_func in checks:
        print(f"\n🔍 Checking {check_name}...")
        if not check_func():
            all_passed = False
    
    print("\n" + "=" * 60)
    
    if not all_passed:
        print("❌ Some checks failed. Please fix the issues above before starting the server.")
        print("\n💡 Quick setup commands:")
        print("   1. Create virtual environment: python -m venv venv")
        print("   2. Activate virtual environment:")
        print("      - Windows: .\\venv\\Scripts\\activate")
        print("      - macOS/Linux: source venv/bin/activate")
        print("   3. Install dependencies: pip install fastapi uvicorn PyPDF2 python-docx")
        return False
    
    print("✅ All checks passed!")
    show_usage_info()
    
    # Start the server
    return start_fastapi_server()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 