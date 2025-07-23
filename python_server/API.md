# AI Resume Analyzer Python API Documentation

---

## Purpose & Usage

This file is the **single source of truth** for understanding and using the REST API provided by the `python_server` backend. It is designed so that:

- **Developers, integrators, and AI agents** can learn how to connect to and use every endpoint without reading the backend code.
- You can understand not just _what_ endpoints exist, but _why_ they were designed this way, and how to use them securely and effectively.
- All validation, security, and architectural decisions are documented here for transparency and ease of onboarding.

**If you want to connect to this API, start here.**

---

## Project Overview

The AI Resume Analyzer is a robust, modular, and secure backend for analyzing resumes against job descriptions using advanced AI (Groq's LLaMA3 model). It provides:

- **Comprehensive resume analysis** with actionable feedback and scoring.
- **Strict validation and security** to protect against malicious or non-professional input.
- **Async, scalable architecture** using FastAPI and MongoDB.
- **Clear, versioned REST API** for easy integration with web frontends, automation scripts, or AI agents.

---

## How to Use This API

1. **Authentication**

   - All analysis endpoints require a JWT Bearer token in the `Authorization` header. The token must include a `userId` claim.
   - (Token issuance is handled by your authentication provider, not this API.)

2. **Making Requests**

   - Use the endpoint documentation below to see required parameters, validation rules, and example requests.
   - Example (using curl):
     ```bash
     curl -X POST "http://localhost:8000/api/v1/analyze" \
       -H "Authorization: Bearer <token>" \
       -F "resume=@resume.pdf" \
       -F "jobDescriptionFilename=Software Engineer..."
     ```
   - See also the Python and JavaScript examples at the end of this file.

3. **Interpreting Responses**

   - All responses are JSON. Success and error schemas are documented below.
   - For analysis, see the [Response Schema](#response-schema) for detailed structure.

4. **Fetching Analysis Results**

   - **Important:** After submitting an analysis request, the Python server saves the result directly to MongoDB and returns only a minimal response (success/failure and analysis ID).
   - **To fetch the full analysis result, your backend must query MongoDB directly.**
   - The Python server does **not** provide endpoints for fetching analysis status or results.

5. **Troubleshooting**
   - Common error messages and their solutions are listed in the Troubleshooting section.
   - Health endpoints are available for monitoring and debugging.

---

## Common Pitfalls

Here are the most frequent mistakes and issues users encounter when using this API, with tips to avoid them:

- **Authentication Issues**

  - Forgetting to include the JWT Bearer token in the `Authorization` header.
  - Using an expired or invalid token.
  - Not including the required `userId` claim in the token.
  - _Tip: Always check your token and include it in every request to analysis endpoints._

- **Validation Failures**

  - Uploading files that are too large (>5MB) or in unsupported formats (not PDF/DOCX/TXT).
  - Submitting a job description that is too short (<50 words) or too long (>1000 words).
  - Trying to provide both a job description file and text at the same time.
  - _Tip: Read the parameter and validation rules for each endpoint before submitting._

- **Rate Limiting**

  - Hitting the daily request limit (15 per IP) and not understanding why further requests are rejected.
  - Not checking the rate limit headers in the response.
  - _Tip: Monitor the `X-RateLimit-Remaining` header and plan your requests accordingly._

- **AI/Content Security**

  - Submitting content that is not professional or job-related, causing the AI to block the request.
  - Including code, system prompts, or off-topic requests in the resume or job description.
  - _Tip: Only submit genuine, professional resume and job description content._

- **File Extraction Issues**

  - Uploading a PDF that is image-based or corrupted, leading to failed text extraction.
  - Submitting a DOCX file with unusual formatting that the parser can’t handle.
  - _Tip: Test your files for readability before uploading. If extraction fails, try converting to plain text._

- **Misinterpreting Responses**

  - Not checking for error messages in the response.
  - Expecting a different response structure than what is documented.
  - _Tip: Always check the `error` field in responses and refer to the documented response schema._

- **Environment/Setup**
  - Missing required environment variables (like `GROQ_API_KEY`).
  - Not running the server in a virtual environment or with the correct dependencies.
  - _Tip: Follow the setup instructions in the README and ensure all environment variables are set._

---

## Design Rationale & Best Practices

- **Why strict validation?**

  - To ensure only professional, job-related content is analyzed.
  - To prevent abuse, resource exhaustion, and prompt injection attacks.
  - To guarantee high-quality, actionable feedback from the AI.

- **Why rate limiting?**

  - To prevent abuse and ensure fair usage for all users.
  - Default: 15 requests per IP per day (configurable).

- **Why AI-based security?**

  - The Groq AI model is used not just for analysis, but also to detect and block malicious, off-topic, or unsafe content before any processing occurs.

- **Why these limits (file size, word count, etc.)?**

  - To balance performance, cost, and user experience.
  - To ensure the AI model receives manageable, relevant input.

- **How to extend or contribute?**
  - Add new endpoints in the `routes/` directory.
  - Update validation or configuration in `app/config.py`.
  - All changes should be reflected in this `API.md` for consistency.

---

## Table of Contents

- [Root Endpoint](#root-endpoint)
- [Analysis Endpoint](#analysis-endpoint)
- [Health Endpoints](#health-endpoints)
- [Authentication & Security](#authentication--security)
- [Rate Limiting](#rate-limiting)
- [Validation & Error Handling](#validation--error-handling)
- [Response Schema](#response-schema)
- [Configuration](#configuration)
- [File Locations](#file-locations)

---

## Root Endpoint

### `GET /`

- **Description:** Returns API status, version, and documentation links.
- **Response:**
  ```json
  {
    "message": "AI Resume Analyzer API",
    "status": "running",
    "version": "1.0.0",
    "docs": "/docs",
    "health": "/api/v1/health"
  }
  ```
- **Location:** [`main.py`](main.py)

---

## Analysis Endpoint

All endpoints require authentication via a JWT Bearer token in the `Authorization` header. See [Authentication & Security](#authentication--security).

**File:** [`routes/analysis_routes.py`](routes/analysis_routes.py)

### `POST /api/v1/analyze`

- **Description:** Analyze a resume against a job description using AI. Accepts resume file and job description (file or text).
- **Parameters:**
  - `resume` (file, required): PDF, DOCX, or TXT resume file.
  - `job_description` (file, optional): Job description file.
  - `jobDescriptionFilename` (string, optional): Filename for job description (used when providing text input).
  - `jobDescriptionText` (string, optional): Raw job description text content.
  - **Note:** Provide either `job_description` file OR both `jobDescriptionFilename` and `jobDescriptionText`, not both.
- **Authentication:** Required (JWT Bearer token)
- **Validation:**
  - Resume: max 5MB, max 7 pages (PDF/DOCX), max 8000 words
  - Job description: 50-1000 words
  - Allowed file types: pdf, docx, txt
- **Response:**
  - `200 OK`: Minimal response with analysis ID and status (see below)
  - `400/401/429/500`: ErrorResponse object
- **Example (with file):**
  ```bash
  curl -X POST "http://localhost:8000/api/v1/analyze" \
    -H "Authorization: Bearer <token>" \
    -F "resume=@resume.pdf" \
    -F "job_description=@job_description.pdf"
  ```
- **Example (with text):**
  ```bash
  curl -X POST "http://localhost:8000/api/v1/analyze" \
    -H "Authorization: Bearer <token>" \
    -F "resume=@resume.pdf" \
    -F "jobDescriptionFilename=job_description.txt" \
    -F "jobDescriptionText=Software Engineer position with 3+ years experience..."
  ```
- **After submitting:**
  - The response will include an `analysisId` and status.
  - **To get the full analysis result, your backend must fetch it directly from MongoDB using the `analysisId`.**
  - The Python server does not provide endpoints for fetching analysis status or results.

---

## Health Endpoints

**File:** [`routes/health_routes.py`](routes/health_routes.py)

### `GET /api/v1/health`

- **Description:** Returns comprehensive health status of the server, MongoDB, Groq AI, rate limiting, and validation limits.
- **Response:**
  ```json
  {
    "status": "healthy|degraded|unhealthy",
    "timestamp": "...",
    "version": "1.0.0",
    "services": { ... },
    "rate_limiting": { ... },
    "validation_limits": { ... },
    "system": { ... },
    "environment": { ... }
  }
  ```

### `GET /api/v1/health/simple`

- **Description:** Simple health check for load balancers and monitoring.
- **Response:**
  ```json
  { "status": "healthy|degraded|unhealthy", "timestamp": "..." }
  ```

---

## Authentication & Security

- **Authentication:** All analysis endpoints require a JWT Bearer token in the `Authorization` header. The token must contain a `userId` claim.
- **How to obtain a token:** (Not provided by this API; assumed to be handled by a separate authentication service.)
- **Security:**
  - AI-based validation blocks malicious or non-professional content.
  - All content is validated for prompt injection, code, and off-topic requests.
  - Only professional, job-related content is allowed.
- **Implementation:** [`app/middleware.py`](app/middleware.py)

---

## Rate Limiting

- **Limit:** 15 requests per IP per day (configurable via `MAX_REQUESTS_PER_DAY` env variable)
- **Headers:**
  - `X-RateLimit-Limit`: Max requests per day
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp (epoch)
- **Exemptions:** Health and documentation endpoints are not rate limited.
- **Implementation:** [`app/middleware.py`](app/middleware.py)

---

## Validation & Error Handling

- **Validation:**
  - Resume: max 5MB, max 7 pages (PDF/DOCX), max 8000 words
  - Job description: 50-1000 words
  - Allowed file types: pdf, docx, txt
- **Error Responses:**
  - All errors return a structured JSON object:
    ```json
    {
      "error": "error_code",
      "message": "Error message",
      "details": "Optional details"
    }
    ```
- **Common error codes:**
  - `rate_limit_exceeded`, `invalid_token`, `not_found`, `internal_server_error`, `validation_error`, etc.
- **Implementation:** [`app/models.py`](app/models.py), [`main.py`](main.py)

---

## Response Schema

See [`response_schema.json`](response_schema.json) for the full schema. Example response:

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

---

## Configuration

- **Environment Variables:**
  - `GROQ_API_KEY`: Groq API key (required)
  - `GROQ_MODEL`: AI model (default: llama3-8b-8192)
  - `MONGODB_URL`: MongoDB connection string
  - `MONGODB_DATABASE`: MongoDB database name
  - `MAX_REQUESTS_PER_DAY`: Daily rate limit (default: 15)
  - `CORS_ORIGINS`: Allowed CORS origins
  - `JWT_SECRET`: JWT secret for authentication
- **Validation Limits:**
  - File size: 5MB
  - PDF/DOCX pages: 7
  - Resume: 8000 words
  - Job description: 50-1000 words
  - Allowed file types: pdf, docx, txt
- **Implementation:** [`app/config.py`](app/config.py)

---

## File Locations

- `main.py`: FastAPI app, root endpoint, error handlers
- `routes/analysis_routes.py`: Analysis endpoint
- `routes/health_routes.py`: Health endpoints
- `app/middleware.py`: Rate limiting, authentication
- `app/models.py`: Response and error models
- `app/config.py`: Configuration and validation limits
- `response_schema.json`: Full response schema
- `sample_response.json`: Example analysis response

---
