# 🚀 Startup Manual - AI Resume Analyzer

## **Prerequisites**

- Node.js 18+ installed
- Python 3.8+ installed
- MongoDB running (optional, for storing analysis results)
- Groq API key configured

## **Step 1: Start Backend (Node.js)**

```bash
cd backend
npm install
npm run dev
```

**Expected Output:** Server listening on port 5000

## **Step 2: Start Python Server**

```bash
cd python_server
# Create virtual environment (if not exists)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your Groq API key
echo "GROQ_API_KEY=your_actual_groq_api_key_here" > .env

# Start Python server
python main.py
```

**Expected Output:** ✅ All checks passed! Starting FastAPI server...

## **Step 3: Start Frontend**

```bash
cd frontend
npm install
npm run dev
```

**Expected Output:** Local server running on http://localhost:5173

## **🔍 Connection Verification**

### **1. Check Python Server Health**

Visit: http://localhost:8000/health
**Expected:** `{"status": "healthy", "services": {...}}`

### **2. Check Backend Health**

Visit: http://localhost:5000/api/health
**Expected:** `{"status": "healthy", "database": {...}}`

### **3. Check Frontend**

Visit: http://localhost:5173
**Expected:** Resume analyzer homepage loads

### **4. Test API Connection**

Visit: http://localhost:8000/docs
**Expected:** FastAPI interactive documentation

## **🔧 Troubleshooting**

### **Python Server Won't Start**

- ✅ Check if virtual environment is activated
- ✅ Verify GROQ_API_KEY in .env file
- ✅ Ensure all dependencies are installed
- ✅ Check if port 8000 is available

### **Backend Can't Connect to Python**

- ✅ Verify Python server is running on port 8000
- ✅ Check PYTHON_API_URL in backend/.env
- ✅ Test Python API health endpoint

### **Frontend Can't Connect to Backend**

- ✅ Verify backend is running on port 5000
- ✅ Check API_BASE_URL in frontend/src/services/api.ts
- ✅ Ensure CORS is properly configured

### **Analysis Not Working**

- ✅ Check Python server logs for AI errors
- ✅ Verify Groq API key is valid
- ✅ Ensure files are properly uploaded
- ✅ Check backend logs for connection issues

## **📊 Service Status Dashboard**

| Service    | URL                        | Status Check     |
| ---------- | -------------------------- | ---------------- |
| Frontend   | http://localhost:5173      | Homepage loads   |
| Backend    | http://localhost:5000      | /api/health      |
| Python API | http://localhost:8000      | /health          |
| API Docs   | http://localhost:8000/docs | Interactive docs |

## **🎯 Quick Test**

1. **Upload a resume** (PDF/DOCX/TXT)
2. **Add job description** (text or file)
3. **Start analysis**
4. **Check results** in dashboard

**Expected Flow:**
Frontend → Backend → Python API → Groq AI → Results → Dashboard

## **🛑 Stopping Services**

Press `Ctrl+C` in each terminal window to stop the services.

## **📝 Environment Variables**

### **Backend (.env)**

```
PORT=5000
PYTHON_API_URL=http://localhost:8000
MONGO_URI=mongodb://localhost:27017/resume_analyzer
```

### **Python Server (.env)**

```
GROQ_API_KEY=your_actual_groq_api_key_here
GROQ_MODEL=llama3-70b-8192
MONGODB_URL=mongodb://localhost:27017
```

## **✅ Success Indicators**

- ✅ All three services start without errors
- ✅ Health checks return "healthy" status
- ✅ File upload works
- ✅ Analysis completes successfully
- ✅ Results display in dashboard
- ✅ Database stores analysis history (if MongoDB is running)
