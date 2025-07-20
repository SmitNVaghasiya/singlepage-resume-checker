# Test Node Server

A simple Node.js Express server with multiple API endpoints for testing and development purposes.

## Features

- ✅ 6 API endpoints including one that lists all available APIs
- ✅ Environment variable configuration
- ✅ CORS enabled
- ✅ Security headers with Helmet
- ✅ Error handling and 404 responses
- ✅ Health check and status endpoints
- ✅ JSON response format

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: Add more environment variables as needed
# DATABASE_URL=mongodb://localhost:27017/test
# JWT_SECRET=your-secret-key
# API_KEY=your-api-key
```

### 3. Run the Server

**Development mode (with auto-restart):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

### 1. List All APIs

**GET** `/api/apis`

Returns a list of all available API endpoints with descriptions and examples.

**Response:**

```json
{
  "success": true,
  "message": "Available APIs",
  "count": 6,
  "apis": [
    {
      "path": "/api/apis",
      "method": "GET",
      "description": "Get list of all available APIs",
      "example": "/api/apis"
    }
    // ... more APIs
  ]
}
```

### 2. Get All Users

**GET** `/api/users`

Returns a list of sample users.

**Response:**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "count": 4,
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
    // ... more users
  ]
}
```

### 3. Get User by ID

**GET** `/api/users/:id`

Returns a specific user by their ID.

**Example:** `/api/users/1`

**Response:**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### 4. Health Check

**GET** `/api/health`

Returns server health status and uptime information.

**Response:**

```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "version": "1.0.0"
}
```

### 5. Server Status

**GET** `/api/status`

Returns detailed server and system information.

**Response:**

```json
{
  "success": true,
  "server": {
    "name": "Test Node Server",
    "version": "1.0.0",
    "status": "running",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456,
    "environment": "development",
    "port": 3000
  },
  "system": {
    "nodeVersion": "v18.0.0",
    "platform": "win32",
    "memory": {
      "rss": 12345678,
      "heapTotal": 9876543,
      "heapUsed": 5432109
    },
    "pid": 1234
  }
}
```

### 6. Echo Endpoint

**POST** `/api/echo`

Echoes back the request body, headers, and query parameters.

**Request Body:**

```json
{
  "message": "Hello World",
  "data": {
    "key": "value"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Request echoed back successfully",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "method": "POST",
  "url": "/api/echo",
  "headers": {
    /* request headers */
  },
  "body": {
    "message": "Hello World",
    "data": {
      "key": "value"
    }
  },
  "query": {
    /* query parameters */
  }
}
```

## Root Endpoint

**GET** `/`

Returns welcome message and basic information about the server.

## Error Handling

- **404 Not Found**: Returns JSON error response with available endpoints
- **500 Internal Server Error**: Returns JSON error response (detailed in development)

## Environment Variables

| Variable   | Default       | Description        |
| ---------- | ------------- | ------------------ |
| `PORT`     | `3000`        | Server port number |
| `NODE_ENV` | `development` | Environment mode   |

## Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with auto-restart
- `npm test` - Run tests (placeholder)

## Dependencies

- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable loader
- **helmet** - Security headers
- **nodemon** - Development auto-restart (dev dependency)

## Testing the APIs

You can test the APIs using:

1. **Browser**: Visit `http://localhost:3000/api/apis` to see all endpoints
2. **cURL**:
   ```bash
   curl http://localhost:3000/api/health
   ```
3. **Postman**: Import the endpoints and test them
4. **JavaScript fetch**:
   ```javascript
   fetch("http://localhost:3000/api/users")
     .then((response) => response.json())
     .then((data) => console.log(data));
   ```

## Project Structure

```
test-node-server/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (create this)
└── README.md         # This file
```

## License

ISC
