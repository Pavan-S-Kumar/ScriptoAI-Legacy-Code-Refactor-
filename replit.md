# Legacy Code Analyzer Demo

## Overview

A cloud-first, minimal legacy code analyzer demo that allows users to upload repository ZIP files or paste GitHub URLs for analysis. The application uses n8n workflow orchestration for processing (in demo mode, simulates results after 3 seconds).

## Project Structure

```
├── client/                 # React frontend (TypeScript)
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── header.tsx            # App header with status indicator
│   │   │   ├── footer.tsx            # App footer
│   │   │   ├── upload-form.tsx       # File/URL upload form
│   │   │   ├── status-display.tsx    # Job status display
│   │   │   ├── results-display.tsx   # Analysis results with summary/issues
│   │   │   ├── empty-state.tsx       # Empty state placeholder
│   │   │   ├── theme-provider.tsx    # Dark/light theme context
│   │   │   └── theme-toggle.tsx      # Theme toggle button
│   │   ├── pages/
│   │   │   └── home.tsx              # Main page with all functionality
│   │   └── lib/
│   │       └── queryClient.ts        # React Query configuration
├── server/                 # Express backend (TypeScript)
│   ├── routes.ts           # API endpoints (/analyze, /callback, /status)
│   └── storage.ts          # In-memory job storage
├── shared/                 # Shared types
│   └── schema.ts           # Zod schemas for validation
├── demo-repos/             # Sample test repositories
└── design_guidelines.md    # UI/UX design guidelines
```

## Tech Stack

- **Frontend**: React + TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js + TypeScript
- **State Management**: TanStack React Query
- **Validation**: Zod schemas
- **Styling**: Tailwind CSS with custom color theme

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/analyze` | POST | Start analysis job (multipart form-data) |
| `/api/status/:requestId` | GET | Get job status and results |
| `/api/callback` | POST | Callback for n8n workflow results |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `N8N_WEBHOOK` | No | n8n webhook URL (demo mode if not set) |
| `CALLBACK_SECRET` | No | Shared secret for callback validation |
| `EXTERNAL_BASE` | No | Public backend base URL for callbacks |

## Key Features

1. **Upload Form**: Supports ZIP file upload or GitHub URL input
2. **Analysis Modes**: Quick, Standard, Deep analysis options
3. **Real-time Status**: Polls job status every 2 seconds
4. **Results Display**: Summary cards, issue list, JSON viewer
5. **Theme Toggle**: Light/dark mode support
6. **Demo Mode**: Simulates analysis results when n8n is not configured

## Running the Project

The application runs on port 5000 with a combined Express + Vite setup:
- Backend: Express handles API routes
- Frontend: Vite serves React app with HMR

## Recent Changes

- Initial implementation with full frontend/backend integration
- Added Zod validation for API requests
- Implemented demo mode for testing without n8n
- Added theme toggle and responsive design
