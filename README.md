# CareerPath AI — Career & Skill Gap Agent

A full stack application that compares resume experience with a target job description, returns matched skills and gaps, generates a 4-week learning roadmap, and stores all user analyses in MongoDB.

## Technology

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide icons
- **API:** Python, FastAPI, Pydantic, PyMuPDF for PDF text extraction
- **Database:** MongoDB + Motor Async Driver (with in-memory fallback for local dev)
- **Analysis:** Transparent skill dictionary and weighted matching; no LLM key required

## Database & Persistence (MongoDB)

Analysis records are saved to MongoDB in the `analysis_records` collection, storing:
- PDF resume filename & parsed text
- Target job description
- Extracted skills (resume skills & job skills)
- Matched skills vs missing skill gaps
- Overall skill coverage percentage
- Generated 4-week learning roadmap
- ISO created timestamp

### Environment Variables
Set your MongoDB connection settings in `backend/.env` or as environment variables:
```bash
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=careerpath_db
```
*(Supports local MongoDB instances as well as MongoDB Atlas cloud clusters)*.

## API Endpoints

- `GET  /api/health` — API health check (includes `mongodb_connected` status)
- `POST /api/analyze` — Analyze resume & job description, return results, and persist record in MongoDB
- `GET  /api/analyses` — List all saved analysis records from MongoDB
- `GET  /api/analyses/{id}` — Retrieve a specific analysis record by ID
- `DELETE /api/analyses/{id}` — Delete a specific analysis record from MongoDB

## Run Locally

### API

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs are live at http://localhost:8000/docs.

### Web App

```powershell
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://localhost:8000` (override with `VITE_API_URL`).
