# ScriptoAI - Legacy Code Analyzer

A cloud-first code analyzer that uses AI (Google Gemini) to analyze and refactor your code.

## Overview

This application allows users to:
- Upload a repository ZIP file or paste a GitHub URL
- Select an analysis mode (quick, standard, or deep)
- View real-time analysis status with automatic polling
- See detailed results including issues, file analysis, and AI-powered refactoring suggestions

## Architecture

- **Frontend**: React with TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Express.js with TypeScript
- **AI**: Google Gemini API for code refactoring
- **Storage**: In-memory storage (can be extended to SQLite/PostgreSQL)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Your Google Gemini API key (get it from https://aistudio.google.com/apikey) |
| `PORT` | No | Server port (default: 5000) |
| `N8N_WEBHOOK` | No | n8n webhook URL for advanced orchestration |
| `CALLBACK_SECRET` | No | Shared secret for callback validation |

**NOTE**: If `N8N_WEBHOOK` is not set, the app runs in demo mode with local analysis.

## Local Development Setup (Windows 11)

### Prerequisites

1. **Node.js 18+** - Download from https://nodejs.org/
2. **Git** - Download from https://git-scm.com/
3. **Gemini API Key** - Get free from https://aistudio.google.com/apikey

### Installation Steps

1. **Clone the repository**
   ```cmd
   git clone <your-repo-url>
   cd ScriptoAI_Clean
   ```

2. **Install dependencies**
   ```cmd
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`:
     ```cmd
     copy .env.example .env
     ```
   - Open `.env` in a text editor and add your Gemini API key:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     PORT=5000
     ```

4. **Start the development server**
   ```cmd
   npm run dev
   ```

5. **Open in browser**
   - Navigate to http://localhost:5000

### Production Build

```cmd
npm run build
npm start
```


### 2. Configure n8n Workflow

Import the n8n workflow with these nodes:

1. **Webhook (POST)**
   - Path: `legacy-analyze`
   - Response Mode: On Received
   - Accepts: request_id, analysis_mode, repo_url, callback_url, callback_secret, code_zip

2. **Call Runner** (HTTP Request POST)
   - URL: `https://YOUR_RUNNER_HOST/run-analysis`
   - Body: JSON with request_id, analysis_mode, repo_url

3. **Prepare Callback Payload** (Set node)
   - callback_secret: Your CALLBACK_SECRET
   - request_id, status, results from runner

4. **POST Callback** (HTTP Request)
   - URL: `{{ callback_url }}`
   - Body: callback_secret, request_id, status, results

### 3. Deploy Runner (Optional)

For production, deploy the Flask runner on Render/Heroku:

```python
# runner/app.py - Minimal demo runner
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/run-analysis', methods=['POST'])
def run_analysis():
    data = request.get_json()
    return jsonify({
        "request_id": data.get("request_id"),
        "status": "completed",
        "summary": {
            "languages": ["python"],
            "total_files_analyzed": 1,
            "issues_count": {"critical": 0, "major": 0, "minor": 1}
        },
        "issues": [],
        "patches": [],
        "verification": {"tests_run": 0, "passed": 0, "failed": 0, "logs": ""}
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
```

## API Endpoints

### POST /api/analyze

Start a new analysis job.

**Request (multipart/form-data)**:
- `code_zip` (file, optional): ZIP file containing code
- `repo_url` (string, optional): GitHub repository URL
- `analysis_mode` (string): "quick" | "standard" | "deep"

**Response**:
```json
{
  "request_id": "req-abc12345"
}
```

### GET /api/status/:requestId

Get the status of an analysis job.

**Response**:
```json
{
  "id": "req-abc12345",
  "status": "completed",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:05.000Z",
  "analysisMode": "standard",
  "repoUrl": "https://github.com/user/repo",
  "results": { ... }
}
```

### POST /api/callback

Callback endpoint for n8n workflow.

**Request**:
```json
{
  "callback_secret": "your-secret",
  "request_id": "req-abc12345",
  "status": "completed",
  "results": { ... }
}
```

## Testing

1. Start the application
2. Open the UI in your browser
3. Upload a ZIP file or paste a GitHub URL
4. Select an analysis mode
5. Click "Start Analysis"
6. Watch the status update in real-time
7. View the detailed results when complete

## Demo Mode

If `N8N_WEBHOOK` is not configured, the app runs in demo mode:
- Analysis completes after 3 seconds
- Returns simulated results with sample issues

## Security Notes

- **Never hardcode secrets** - use environment variables
- **Runner sandbox**: For production, run analyzers in Docker containers
- **HTTPS**: Use HTTPS for all endpoints
- **Validate callbacks**: Always verify callback_secret

## File Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── routes.ts           # API endpoints
│   └── storage.ts          # Data storage
├── shared/                 # Shared types
│   └── schema.ts           # TypeScript schemas
├── demo-repos/             # Sample test repos
└── README.md               # This file
```

