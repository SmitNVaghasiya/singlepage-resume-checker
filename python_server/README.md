# AI Resume Analyzer Python Server

A robust, modular, and secure AI-powered resume analysis system using Groq's LLaMA model. This application provides comprehensive resume evaluation against job descriptions, with detailed feedback, actionable recommendations, and strong validation and security features.

## 🔑 Authentication

- **All analysis requests require authentication.**
- Include a valid JWT Bearer token in the `Authorization` header for every `/api/v1/analyze` request.
- The token must contain a `userId` claim.
- If the token is missing or invalid, the server will return a 401 Unauthorized error and will not process the analysis.

**Example header:**

```
Authorization: Bearer <your_jwt_token>
```

## 🌟 Features

- **Advanced AI Analysis**: Uses Groq's LLaMA3 model (default: llama3-8b-8192) for deep resume analysis
- **Multi-format Support**: Handles PDF, DOCX, and TXT files with intelligent fallback processing
- **Job Description Validation**: AI-powered validation to ensure proper job descriptions
- **Comprehensive Response Validation**: Multi-layer validation ensures AI responses match strict schema requirements
- **Database Integration**: MongoDB async integration for storing analysis results
- **Detailed Feedback**: Provides scores, strengths, weaknesses, and actionable recommendations
- **RESTful API**: FastAPI-based with automatic documentation and error handling
- **Rate Limiting**: In-memory rate limiting with daily request limits
- **Input Validation**: Comprehensive file size, page count, and content length validation
- **Enhanced Security**: AI-based security validation and input sanitization
- **Async Processing**: All major operations are async for performance

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- MongoDB (for storing analysis results)
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
   GROQ_MODEL=llama3-8b-8192
   MONGODB_URL=mongodb://localhost:27017
   MONGODB_DATABASE=resume_analyzer
   MONGODB_COLLECTION=analyses
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=30d
   ```

5. **Run the application**

   ```bash
   # Recommended: Direct execution with built-in checks
   python main.py

   # Alternative: Manual uvicorn
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## 📡 API Endpoints

> **For full API reference and integration details, see [API.md](./API.md).**

### 1. Analyze Resume

**POST** `/api/v1/analyze`

Comprehensively analyze a resume against a job description.

**Authentication Required:**

- You must include a valid JWT Bearer token in the `Authorization` header for this endpoint. Requests without authentication will be rejected.

**Parameters:**

- `resume` (file): Resume file (PDF, DOCX, or TXT)
- `job_description` (file, optional): Job description file
- `jobDescriptionFilename` (string, optional): Filename for job description (used when providing text input)
- `jobDescriptionText` (string, optional): Raw job description text content
- **Note:** You must provide either a job description file OR both filename and text, not both.

**Limits:**

- File size: Maximum 5MB
- PDF/DOCX pages: Maximum 7 pages
- Job description: 50-1000 words
- Resume tokens: Maximum 8000 words
- Daily requests: 15 per IP address

**Example (with file):**

```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Authorization: Bearer <token>" \
  -F "resume=@resume.pdf" \
  -F "job_description=@job_description.pdf"
```

**Example (with text):**

```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Authorization: Bearer <token>" \
  -F "resume=@resume.pdf" \
  -F "jobDescriptionFilename=job_description.txt" \
  -F "jobDescriptionText=Software Engineer position requiring Python, FastAPI, and AI/ML experience..."
```

**Response:**

- Returns a minimal response with `analysisId` and status (success/failure).
- **To get the full analysis result, your backend must fetch it directly from MongoDB using the `analysisId`.**
- The Python server does **not** provide endpoints for fetching analysis status or results.

### 2. Health Check

**GET** `/api/v1/health`

Comprehensive health check including service status, rate limiting stats, system, and environment information.

**GET** `/api/v1/health/simple`

Simple health check for load balancers and monitoring.

### 3. API Documentation

- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🛡️ Security & Validation Features

### Rate Limiting

- **Daily Limits**: 15 requests per IP address per day (configurable)
- **Rate Limit Stats**: Exposed in `/api/v1/health` endpoint
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

See [`response_schema.json`](./response_schema.json) for the full schema. Example response:

```json
{
  "job_description_validity": "Valid",
  "resume_validity": "Valid",
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
  "overall_fit_summary": "Resume shows strong Python foundation and genuine AI/ML interest with practical projects, but lacks explicit mention of deep learning frameworks (TensorFlow/PyTorch) and detailed technical implementation metrics in existing AI projects.",
  "resume_analysis_report": { ... }
}
```

## 🔧 Configuration

### Environment Variables

- `GROQ_API_KEY`: Your Groq API key (required)
- `GROQ_MODEL`: AI model to use (default: llama3-8b-8192)
- `MONGODB_URL`: MongoDB connection string (required)
- `MONGODB_DATABASE`: MongoDB database name (default: resume_analyzer)
- `MONGODB_COLLECTION`: MongoDB collection name (default: analyses)
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `MAX_REQUESTS_PER_DAY`: Daily rate limit per IP (default: 15)
- `JWT_SECRET`: JWT secret for authentication (required for user endpoints)
- `JWT_EXPIRES_IN`: JWT expiration (default: 30d)

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
3. Use interactive documentation to test endpoints (ensure you provide a valid Authorization header)

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

# Analyze resume with file upload
with open('resume.pdf', 'rb') as resume_file:
    with open('job_description.pdf', 'rb') as job_desc_file:
        response = requests.post(
            'http://localhost:8000/api/v1/analyze',
            headers={'Authorization': 'Bearer <token>'},
            files={
                'resume': resume_file,
                'job_description': job_desc_file
            }
        )

# Analyze resume with text input
with open('resume.pdf', 'rb') as resume_file:
    response = requests.post(
        'http://localhost:8000/api/v1/analyze',
        headers={'Authorization': 'Bearer <token>'},
        files={'resume': resume_file},
        data={
            'jobDescriptionFilename': 'job_description.txt',
            'jobDescriptionText': 'Python developer position requiring FastAPI, AI/ML experience...'
        }
    )

    if response.status_code == 200:
        result = response.json()
        print(f"Analysis ID: {result['analysisId']}")
        # Fetch the full analysis result directly from MongoDB using analysisId
    else:
        print(f"Error: {response.json()}")
```

### JavaScript Example

```javascript
// With file upload
const formData = new FormData();
formData.append("resume", resumeFile);
formData.append("job_description", jobDescriptionFile);

// With text input
const formData = new FormData();
formData.append("resume", resumeFile);
formData.append("jobDescriptionFilename", "job_description.txt");
formData.append("jobDescriptionText", jobDescriptionText);

fetch("http://localhost:8000/api/v1/analyze", {
  method: "POST",
  headers: { Authorization: "Bearer <token>" },
  body: formData,
})
  .then((response) => response.json())
  .then((data) => {
    if (data.analysisId) {
      console.log("Analysis ID:", data.analysisId);
      // Fetch the full analysis result directly from MongoDB using analysisId
    } else {
      console.log("Error:", data);
    }
  })
  .catch((error) => console.error("Error:", error));
```

## 🐛 Troubleshooting

### Common Issues

1. **"Missing or invalid Authorization header" / "Invalid token"**
   - All analysis requests require a valid JWT Bearer token in the Authorization header.
   - Ensure your token is present, valid, and contains a `userId` claim.
   - The server will not process analysis for unauthenticated users.
2. **"GROQ_API_KEY environment variable is required"**
   - Ensure `.env` file exists with proper API key
   - Verify API key is not placeholder text
3. **"Rate limit exceeded"**
   - Daily limit of 15 requests per IP reached
   - Wait until tomorrow or contact support for increased limits
4. **"File too large"**
   - Reduce file size to under 5MB
   - Compress PDF or reduce image quality
5. **"Job description too short/long"**
   - Ensure job description is between 50-1000 words
   - Add more details or trim content as needed
6. **"Failed to extract text from PDF"**
   - PDF might be image-based or corrupted
   - Try different PDF processing tool or convert to text
7. **"Job description validation failed"**
   - Ensure job description contains actual job-related content
   - Avoid personal messages or non-professional text

### Debug Mode

Enable detailed logging by setting log level to DEBUG in the code or via environment variable.

### Health Check

Visit `/api/v1/health` endpoint to verify all services are running correctly.

## 📚 Project Structure

```
python_server/
├── main.py                 # FastAPI application (initialization, middleware, error handling)
├── app/
│   ├── models.py          # Pydantic models (response schema, DB models)
│   ├── file_processor.py  # File handling utilities with validation
│   ├── groq_service.py    # AI service integration
│   ├── config.py          # Configuration settings with validation limits
│   ├── database.py        # Database operations
│   └── middleware.py      # Rate limiting, user extraction
├── routes/
│   ├── analysis_routes.py # Analysis endpoint
│   └── health_routes.py   # Health check endpoints
├── requirements.txt       # Dependencies
├── test_improvements.py   # Test script for new features
├── response_schema.json   # Example response schema
├── sample_response.json   # Example response
└── README.md              # This file
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
