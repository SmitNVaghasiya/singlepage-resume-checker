# AI Resume Checker Frontend

This is the frontend codebase for the **AI Resume Checker** web application. It is a modern, full-featured, and modular React (TypeScript) project designed to provide a seamless user experience for resume analysis, job description matching, feedback, and admin management.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Modules & Features](#modules--features)
  - [Pages](#pages)
  - [Components](#components)
  - [Services](#services)
  - [Contexts](#contexts)
  - [Hooks](#hooks)
  - [Utils](#utils)
  - [Styles](#styles)
- [How to Run](#how-to-run)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

The frontend is responsible for:

- User authentication and registration
- Resume upload and analysis
- Job description input and matching
- Feedback collection and management
- Admin dashboard for analytics and user management
- Responsive, modern UI with dark mode support

---

## Tech Stack

- **React** (with TypeScript)
- **Vite** (build tool)
- **Tailwind CSS** and custom CSS modules
- **React Context API** for state management
- **Custom Hooks** for business logic
- **REST API** integration (see `/src/services`)

---

## Folder Structure

```
frontend/
  ├── src/
  │   ├── components/         # Reusable UI and feature components
  │   ├── pages/              # Top-level pages/routes
  │   ├── services/           # API and backend integration
  │   ├── contexts/           # React Context providers
  │   ├── hooks/              # Custom React hooks
  │   ├── utils/              # Utility/helper functions
  │   ├── styles/             # CSS and styling
  │   ├── App.tsx             # Main app component
  │   ├── main.tsx            # Entry point
  │   └── types.ts            # TypeScript types
  ├── public/                 # Static assets
  ├── index.html              # HTML entry point
  ├── package.json            # Project dependencies
  └── ...
```

---

## Modules & Features

### Pages (`src/pages/`)

Each file in this folder represents a top-level route/page:

- **HomePage.tsx**: Landing page with app introduction and features.
- **LoginPage.tsx / RegisterPage.tsx / ResetPasswordPage.tsx**: User authentication flows.
- **DashboardPage.tsx**: Main user dashboard for resume/job analysis.
- **ResumeCheckerPage.tsx**: Step-by-step resume analysis flow.
- **AnalysisDetailsPage.tsx**: Detailed results for a specific analysis.
- **ProfilePage.tsx**: User profile, settings, and history.
- **ContactPage.tsx**: Contact/support form.
- **AdminDashboardPage.tsx**: Admin-only dashboard for analytics, user, and feedback management.
- **NotFoundPage.tsx**: 404 error page.

### Components (`src/components/`)

Organized by feature and UI role:

- **admin/**: Admin panel UI (feedback management, analytics, user controls)
- **analysis/**: Resume analysis UI, loading states, and results
- **auth/**: Authentication modals and handlers
- **dashboard/**: Dashboard widgets and resume analysis UI
- **feedback/**: Feedback form and related UI
- **file-upload/**: File upload, preview, and drag-and-drop components
- **job-description/**: Job description input and stepper UI
- **layout/**: Navbar, footer, hero section, and layout wrappers
- **profile/**: (Reserved for user profile widgets)
- **ui/**: Generic UI elements (FAQ, charts, spinners, progress steps, etc.)

### Services (`src/services/`)

API and backend integration:

- **api.ts**: Centralized API request logic
- **AdminService.ts**: Admin-related API calls
- **AdminFeedbackService.ts**: Admin feedback management
- **AnalysisService.ts**: Resume/job analysis API
- **FeedbackService.ts**: User feedback API
- **PasteService.ts**: Paste/upload helpers

### Contexts (`src/contexts/`)

Global state management:

- **AppContext.tsx**: Main app-wide context (user, theme, etc.)
- **AdminContext.tsx**: Admin-specific state/context

### Hooks (`src/hooks/`)

Custom React hooks for business logic:

- **analysis/**: Hooks for analysis state, completion, and service
- **file-upload/**: File upload and reconstruction hooks
- **shared/**: Reusable hooks (debug, state monitoring, navigation, paste handling)

### Utils (`src/utils/`)

Helper functions and validation:

- **config.ts**: App config/constants
- **fileValidation.ts**: File type/size validation
- **usernameValidation.ts**: Username rules/validation
- **UsernameValidationExample.tsx/.css**: Example and style for username validation

### Styles (`src/styles/`)

Styling for the app:

- **globals.css**: Global styles
- **components.css**: Shared component styles
- **pages/**: Page-specific styles (e.g., homepage, dashboard, profile, etc.)
- **mobile/**: Mobile-specific styles
- **components/**: Component-specific styles

---

## How to Run

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **Build for production:**
   ```bash
   npm run build
   ```
4. **Preview production build:**
   ```bash
   npm run preview
   ```

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements, bug fixes, or new features.

---

## License

This project is licensed under the MIT License.
