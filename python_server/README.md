# AI Resume Analyzer Python Server

A sophisticated AI-powered resume analysis system using Groq's LLaMA model. This application provides comprehensive resume evaluation against job descriptions with detailed feedback and improvement suggestions.

## 🌟 Features

- **Advanced AI Analysis**: Uses Groq's llama3-70b-8192 model for deep resume analysis
- **Multi-format Support**: Handles PDF, DOCX, and TXT files with intelligent fallback processing
- **Job Description Validation**: AI-powered validation to ensure proper job descriptions
- **Comprehensive Response Validation**: Multi-layer validation ensures AI responses match exact schema requirements
- **Database Integration**: MongoDB integration for storing analysis results
- **Detailed Feedback**: Provides scores, strengths, weaknesses, and actionable recommendations
- **RESTful API**: FastAPI-based with automatic documentation and error handling
- **Rate Limiting**: In-memory rate limiting with daily request limits
- **Input Validation**: Comprehensive file size, page count, and content length validation
- **Enhanced Security**: AI-based security validation and input sanitization

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- MongoDB (optional, for storing analysis results)
- Groq API key (get it from [Groq Console](https://console.groq.com/))

### Setup

1. **Navigate to python_server directory**

   ```bash
   cd python_server
   ```

2. **Create and activate virtual environment**

   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create a `.env` file:

   ```
   GROQ_API_KEY=your_actual_groq_api_key_here
   GROQ_MODEL=llama3-70b-8192
   MONGODB_URL=mongodb://localhost:27017
   MONGODB_DATABASE=resume_analyzer
   ```

5. **Run the application**

   ```bash
   # Recommended: Direct execution with built-in checks
   python main.py

   # Alternative: Manual uvicorn
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## 📡 API Endpoints

### 1. Analyze Resume

**POST** `/api/v1/analyze`

Comprehensively analyze a resume against a job description.

**Parameters:**

- `resume` (file): Resume file (PDF, DOCX, or TXT)
- `job_description` (file, optional): Job description file
- `job_description_text` (string, optional): Job description as text
- `user_id` (string, optional): User ID if authenticated

**Limits:**

- File size: Maximum 5MB
- PDF/DOCX pages: Maximum 7 pages
- Job description: 50-1000 words
- Resume tokens: Maximum 8000 words
- Daily requests: 15 per IP address

**Example:**

```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -F "resume=@resume.pdf" \
  -F "job_description_text=Software Engineer position requiring Python, FastAPI, and AI/ML experience..."
```

### 2. Get Analysis Status

**GET** `/api/v1/status/{analysis_id}`

Get the status of an analysis by ID.

### 3. Get Analysis Result

**GET** `/api/v1/result/{analysis_id}`

Get the complete analysis result by ID.

### 4. Health Check

**GET** `/api/v1/health`

Comprehensive health check including service status, rate limiting stats, and system information.

**GET** `/api/v1/health/simple`

Simple health check for load balancers and monitoring.

### 5. API Documentation

- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🛡️ Security & Validation Features

### Rate Limiting

- **Daily Limits**: 15 requests per IP address per day (configurable)
- **Rate Limit Headers**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- **Exempt Endpoints**: Health checks and documentation are not rate limited

### Input Validation

- **File Size**: Maximum 5MB per file
- **Page Limits**: Maximum 7 pages for PDF and DOCX files
- **Content Length**: Job descriptions must be 50-1000 words
- **Token Limits**: Resumes limited to 8000 words
- **File Types**: Only PDF, DOCX, and TXT files allowed

### Security Validation

- **AI-Based Security**: Groq AI validates content for malicious inputs
- **Prompt Injection Protection**: Detects and blocks system prompt extraction attempts
- **Content Sanitization**: Validates content is professional and job-related

## 📋 Response Format

```json
{
  "job_description_validity": "Valid",
  "resume_eligibility": "Eligible",
  "score_out_of_100": 77,
  "short_conclusion": "Candidate is a promising fit for the role with some room for polish.",
  "chance_of_selection_percentage": 70,
  "resume_improvement_priority": [
    "Add specific technical frameworks mentioned in job description",
    "Fix formatting and grammar issues",
    "Include quantifiable achievements",
    "Add GitHub links to showcase projects"
  ],
  "overall_fit_summary": "Resume shows strong technical foundation with practical experience, but needs enhancement in specific areas mentioned in job requirements.",
  "resume_analysis_report": {
    "candidate_information": {
      "name": "Candidate Name",
      "position_applied": "Software Engineer",
      "experience_level": "Entry Level",
      "current_status": "Recent Graduate"
    },
    "strengths_analysis": {
      "technical_skills": [
        "Strong programming foundation",
        "Relevant project experience"
      ],
      "project_portfolio": [
        "Diverse project portfolio",
        "Real-world problem solving"
      ],
      "educational_background": [
        "Relevant academic background",
        "Strong theoretical foundation"
      ]
    },
    "weaknesses_analysis": {
      "critical_gaps_against_job_description": [
        "Missing specific framework experience",
        "Limited professional experience"
      ],
      "technical_deficiencies": ["Needs improvement in advanced concepts"],
      "resume_presentation_issues": [
        "Formatting inconsistencies",
        "Missing quantifiable achievements"
      ],
      "soft_skills_gaps": ["Communication skills not highlighted"],
      "missing_essential_elements": [
        "No GitHub profile",
        "Missing certifications"
      ]
    },
    "section_wise_detailed_feedback": {
      "contact_information": {
        "current_state": "Complete contact information provided",
        "strengths": ["Professional email", "LinkedIn profile included"],
        "improvements": ["Add GitHub profile", "Include portfolio website"]
      },
      "profile_summary": {
        "current_state": "Brief overview of skills and interests",
        "strengths": ["Shows technical focus", "Demonstrates passion"],
        "improvements": [
          "Add quantifiable achievements",
          "Include specific technologies"
        ]
      }
      // ... detailed feedback for all resume sections
    },
    "improvement_recommendations": {
      "immediate_resume_additions": [
        "Add missing technical skills",
        "Include GitHub links"
      ],
      "immediate_priority_actions": [
        "Fix formatting issues",
        "Add quantifiable results"
      ],
      "short_term_development_goals": [
        "Learn required frameworks",
        "Build portfolio"
      ],
      "medium_term_objectives": [
        "Gain professional experience",
        "Obtain certifications"
      ]
    },
    "soft_skills_enhancement_suggestions": {
      "communication_skills": [
        "Add presentation experience",
        "Include technical writing"
      ],
      "teamwork_and_collaboration": [
        "Highlight group projects",
        "Show collaboration"
      ],
      "leadership_and_initiative": [
        "Document leadership roles",
        "Show initiative"
      ],
      "problem_solving_approach": ["Describe problem-solving methodology"]
    },
    "final_assessment": {
      "eligibility_status": "Qualified with Development Needs",
      "hiring_recommendation": "Recommend for interview focusing on potential and learning ability",
      "key_interview_areas": [
        "Technical skills",
        "Learning agility",
        "Communication"
      ],
      "onboarding_requirements": ["Mentorship program", "Technical training"],
      "long_term_potential": "High potential for growth with proper guidance"
    }
  }
}
```

## 🔧 Configuration

### Environment Variables

- `GROQ_API_KEY`: Your Groq API key (required)
- `GROQ_MODEL`: AI model to use (default: llama3-70b-8192)
- `MONGODB_URL`: MongoDB connection string (optional)
- `MONGODB_DATABASE`: MongoDB database name (default: resume_analyzer)
- `MAX_REQUESTS_PER_DAY`: Daily rate limit per IP (default: 15)

### Validation Limits

- **File Size**: 5MB maximum
- **PDF Pages**: 7 pages maximum
- **DOCX Pages**: 7 pages maximum (estimated)
- **Job Description**: 50-1000 words
- **Resume Tokens**: 8000 words maximum

## 🧪 Testing

### Manual Testing

1. Start server: `python main.py`
2. Visit: http://localhost:8000/docs
3. Use interactive documentation to test endpoints

### Automated Testing

Run the test script to verify improvements:

```bash
python test_improvements.py
```

This will test:

- Health check functionality
- Rate limiting
- Input validation
- Error handling

## 📝 API Usage Examples

### Python Example

```python
import requests

# Analyze resume
with open('resume.pdf', 'rb') as resume_file:
    response = requests.post(
        'http://localhost:8000/api/v1/analyze',
        files={'resume': resume_file},
        data={'job_description_text': 'Python developer position requiring FastAPI, AI/ML experience...'}
    )

    if response.status_code == 200:
        result = response.json()
        print(f"Score: {result['score_out_of_100']}")
        print(f"Eligibility: {result['resume_eligibility']}")
        print(f"Key Improvements: {result['resume_improvement_priority']}")
    else:
        print(f"Error: {response.json()}")
```

### JavaScript Example

```javascript
const formData = new FormData();
formData.append("resume", resumeFile);
formData.append("job_description_text", jobDescriptionText);

fetch("http://localhost:8000/api/v1/analyze", {
  method: "POST",
  body: formData,
})
  .then((response) => response.json())
  .then((data) => {
    if (data.job_description_validity === "Valid") {
      console.log("Analysis:", data);
      console.log("Score:", data.score_out_of_100);
    } else {
      console.log("Invalid job description");
    }
  })
  .catch((error) => console.error("Error:", error));
```

## 🐛 Troubleshooting

### Common Issues

1. **"GROQ_API_KEY environment variable is required"**

   - Ensure `.env` file exists with proper API key
   - Verify API key is not placeholder text

2. **"Rate limit exceeded"**

   - Daily limit of 15 requests per IP reached
   - Wait until tomorrow or contact support for increased limits

3. **"File too large"**

   - Reduce file size to under 5MB
   - Compress PDF or reduce image quality

4. **"Job description too short/long"**

   - Ensure job description is between 50-1000 words
   - Add more details or trim content as needed

5. **"Failed to extract text from PDF"**

   - PDF might be image-based or corrupted
   - Try different PDF processing tool or convert to text

6. **"Job description validation failed"**

   - Ensure job description contains actual job-related content
   - Avoid personal messages or non-professional text

### Debug Mode

Enable detailed logging by setting log level to DEBUG in the code.

### Health Check

Visit `/api/v1/health` endpoint to verify all services are running correctly.

## 📚 Project Structure

```
python_server/
├── main.py                 # FastAPI application (clean, focused on initialization)
├── app/
│   ├── models.py          # Pydantic models (defines response schema)
│   ├── file_processor.py  # File handling utilities with validation
│   ├── groq_service.py    # AI service integration
│   ├── config.py          # Configuration settings with validation limits
│   ├── database.py        # Database operations
│   └── middleware.py      # Rate limiting middleware
├── routes/
│   ├── analysis_routes.py # Analysis endpoints with validation
│   └── health_routes.py   # Enhanced health check endpoints
├── requirements.txt       # Dependencies including psutil
├── test_improvements.py   # Test script for new features
├── response_schema.json   # Example response schema
├── sample_response.json   # Example response
└── README.md             # This file
```

## 🔒 Security Features

- **Input Validation**: Comprehensive file and content validation
- **Rate Limiting**: Daily request limits per IP address
- **Prompt Injection Protection**: AI validates job descriptions
- **Schema Enforcement**: Strict response format validation
- **Error Handling**: Detailed error reporting without exposing internals
- **File Safety**: Secure file processing with type detection
- **Content Sanitization**: Validates content is professional and job-related

## 🚀 Performance Features

- **Fallback Processing**: Multiple PDF extraction methods
- **Efficient Validation**: Multi-layer validation system
- **Async Processing**: FastAPI async capabilities
- **Database Integration**: MongoDB for result storage
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Input Limits**: Prevents resource exhaustion

## 📈 Monitoring

The application provides comprehensive monitoring:

- **Health Checks**: Detailed service status and system metrics
- **Rate Limiting Stats**: Track request patterns and limits
- **Validation Metrics**: Monitor input validation results
- **Error Tracking**: Detailed error logging with correlation IDs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section
2. Review logs for detailed error information
3. Check API documentation at `/docs`
4. Run the test script to verify functionality

---

**Note**: This is a professional-grade AI system with comprehensive security and validation features. Always ensure you have proper permissions before analyzing resumes and follow data privacy guidelines.
