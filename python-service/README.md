# Resume Analyzer FastAPI Service

AI-powered resume analysis service using FastAPI, Groq AI, and MongoDB. This service analyzes resumes against job descriptions and provides detailed feedback and scoring.

## Features

- **File Processing**: Supports PDF, DOC, DOCX, and TXT files
- **AI Analysis**: Uses Groq AI for intelligent resume analysis
- **MongoDB Storage**: Stores analysis results for future reference
- **RESTful API**: Clean and well-documented API endpoints
- **Health Monitoring**: Built-in health checks for all services
- **Async Processing**: High-performance async operations

## Prerequisites

- Python 3.8+
- MongoDB (local or cloud)
- Groq API key

## Installation

1. **Navigate to the python-service directory:**

   ```bash
   cd python-service
   ```

2. **Create and activate virtual environment:**

   ```bash
   python -m venv venv

   # On Windows
   .\venv\Scripts\activate

   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   # Server Configuration
   HOST=0.0.0.0
   PORT=8000
   DEBUG=True

   # MongoDB Configuration
   MONGODB_URL=mongodb://localhost:27017
   # Or for MongoDB Atlas:
   # MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
   MONGODB_DATABASE=resume_analyzer
   MONGODB_COLLECTION=analyses

   # Groq AI Configuration
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama3-8b-8192

   # File Processing
   MAX_FILE_SIZE=10485760
   ALLOWED_EXTENSIONS=pdf,doc,docx,txt

   # Logging
   LOG_LEVEL=INFO
   ```

## Usage

### Running the Server

1. **Development mode:**

   ```bash
   python run.py
   ```

2. **Production mode with Uvicorn:**

   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

3. **Using Docker (optional):**
   ```bash
   docker build -t resume-analyzer .
   docker run -p 8000:8000 resume-analyzer
   ```

### API Endpoints

#### Health Check

```http
GET /health
```

#### Analyze Resume

```http
POST /analyze
Content-Type: multipart/form-data

resume: file (PDF, DOC, DOCX, TXT)
job_description: file (PDF, DOC, DOCX, TXT)
```

Response:

```json
{
  "analysis_id": "uuid",
  "status": "completed",
  "message": "Analysis completed successfully",
  "result": {
    "score": 85.5,
    "strengths": ["Strong technical skills", "Relevant experience"],
    "weaknesses": ["Missing certification", "Limited leadership experience"],
    "suggestions": [
      "Consider getting AWS certification",
      "Highlight team leadership"
    ],
    "keyword_match": {
      "matched": ["Python", "React", "AWS"],
      "missing": ["Docker", "Kubernetes"],
      "percentage": 75.0
    },
    "skills_analysis": {
      "required": ["Python", "React", "AWS", "Docker"],
      "present": ["Python", "React", "AWS"],
      "missing": ["Docker"]
    },
    "experience_analysis": {
      "years_required": 3,
      "years_found": 4,
      "relevant": true
    },
    "overall_recommendation": "Strong candidate with good technical fit..."
  }
}
```

#### Get Analysis Result

```http
GET /analysis/{analysis_id}
```

## Configuration

### Environment Variables

| Variable             | Description               | Default                     |
| -------------------- | ------------------------- | --------------------------- |
| `HOST`               | Server host               | `0.0.0.0`                   |
| `PORT`               | Server port               | `8000`                      |
| `DEBUG`              | Debug mode                | `True`                      |
| `MONGODB_URL`        | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DATABASE`   | Database name             | `resume_analyzer`           |
| `MONGODB_COLLECTION` | Collection name           | `analyses`                  |
| `GROQ_API_KEY`       | Groq API key              | Required                    |
| `GROQ_MODEL`         | Groq model name           | `llama3-8b-8192`            |
| `MAX_FILE_SIZE`      | Max file size in bytes    | `10485760` (10MB)           |
| `ALLOWED_EXTENSIONS` | Allowed file extensions   | `pdf,doc,docx,txt`          |
| `LOG_LEVEL`          | Logging level             | `INFO`                      |

### Supported File Types

- **PDF**: Portable Document Format
- **DOCX**: Microsoft Word (newer format)
- **DOC**: Microsoft Word (legacy format - limited support)
- **TXT**: Plain text files

## Integration with Backend

The Node.js backend communicates with this service via HTTP requests:

```typescript
// Backend service call
const response = await axios.post("http://localhost:8000/analyze", formData, {
  headers: {
    ...formData.getHeaders(),
  },
});
```

## Database Schema

### Analysis Document

```json
{
  "_id": "ObjectId",
  "analysis_id": "uuid",
  "resume_filename": "string",
  "job_description_filename": "string",
  "resume_text": "string",
  "job_description_text": "string",
  "result": {
    "score": "number",
    "strengths": ["string"],
    "weaknesses": ["string"],
    "suggestions": ["string"],
    "keyword_match": {
      "matched": ["string"],
      "missing": ["string"],
      "percentage": "number"
    },
    "skills_analysis": {
      "required": ["string"],
      "present": ["string"],
      "missing": ["string"]
    },
    "experience_analysis": {
      "years_required": "number",
      "years_found": "number",
      "relevant": "boolean"
    },
    "overall_recommendation": "string"
  },
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Error Handling

The service includes comprehensive error handling:

- **File validation errors** (400): Invalid file type, size exceeded
- **Processing errors** (500): File extraction, AI analysis failures
- **Database errors** (500): MongoDB connection, query failures
- **AI service errors** (500): Groq API failures

## Logging

Structured logging with different levels:

- **INFO**: General operational messages
- **ERROR**: Error conditions
- **DEBUG**: Detailed debugging information

## Performance

- **Async operations**: All I/O operations are asynchronous
- **File streaming**: Efficient file processing
- **Connection pooling**: MongoDB connection pooling
- **Error recovery**: Graceful error handling and recovery

## Security

- **File validation**: Strict file type and size validation
- **Input sanitization**: Clean text extraction
- **Error masking**: Sensitive information not exposed in errors
- **CORS configuration**: Proper CORS setup for frontend integration

## Development

### Project Structure

```
python-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── models.py            # Pydantic models
│   ├── database.py          # MongoDB operations
│   ├── file_processor.py    # File processing logic
│   └── ai_analyzer.py       # AI analysis logic
├── venv/                    # Virtual environment
├── requirements.txt         # Python dependencies
├── env.example             # Environment variables template
├── .gitignore              # Git ignore rules
├── run.py                  # Main entry point
└── README.md               # This file
```

### Adding New Features

1. **New file type support**: Extend `file_processor.py`
2. **Additional AI models**: Modify `ai_analyzer.py`
3. **New endpoints**: Add routes to `main.py`
4. **Database operations**: Extend `database.py`

## Troubleshooting

### Common Issues

1. **Groq API Key Error**:

   - Ensure `GROQ_API_KEY` is set in `.env`
   - Verify API key is valid

2. **MongoDB Connection Error**:

   - Check MongoDB is running
   - Verify connection string in `.env`

3. **File Processing Error**:

   - Ensure file is not corrupted
   - Check file size limits
   - Verify file type is supported

4. **Import Errors**:
   - Ensure virtual environment is activated
   - Run `pip install -r requirements.txt`

### Debug Mode

Enable debug mode for detailed logging:

```bash
export DEBUG=True
python run.py
```

## License

This project is part of the Resume Checker application.
