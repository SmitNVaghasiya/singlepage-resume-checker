# AI Resume Checker Frontend

A React-based frontend application for AI-powered resume analysis and job matching.

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🔧 Environment Configuration

### 1. Create Environment File

Copy the example environment file:

```bash
cp env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your settings:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=AI Resume Checker
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_DEBUG_MODE=false
```

### 3. Production Deployment

For production, update the API URL:

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

## 📦 Build Output

The production build creates a `dist` folder containing:

- `index.html` - Main HTML file
- `assets/` - Optimized CSS and JavaScript files

## 🌐 Deployment

### Static Hosting (Netlify, Vercel, etc.)

1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Configure environment variables in your hosting platform

### Traditional Web Server (nginx, Apache)

1. Build the project: `npm run build`
2. Copy `dist` folder contents to your web server directory
3. Configure server to serve `index.html` for all routes (SPA routing)

### Docker Deployment

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔍 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:prod` - Build for production with production mode
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

## 📁 Project Structure

```
src/
├── components/     # React components
├── contexts/       # React contexts
├── hooks/          # Custom hooks
├── pages/          # Page components
├── services/       # API services
├── styles/         # CSS styles
├── types.ts        # TypeScript types
└── utils/          # Utility functions
```

## 🔗 API Integration

The frontend communicates with the backend API. Ensure your backend is running and accessible at the URL specified in `VITE_API_BASE_URL`.

## 🛠️ Development

### Adding New Environment Variables

1. Add to `env.example`
2. Add to `src/utils/config.ts`
3. Use in your code via `config` object

### Code Splitting

The build is configured with manual chunks for better performance:

- `vendor` - React and React DOM
- `router` - React Router
- `ui` - UI components (Lucide React)

## 📝 Notes

- The application uses React Router for client-side routing
- All API calls are centralized in `src/services/api.ts`
- Environment variables must be prefixed with `VITE_` to be accessible in the browser
- The build process optimizes assets and creates a production-ready bundle
