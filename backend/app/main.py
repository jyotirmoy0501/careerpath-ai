from __future__ import annotations

import re
from collections import defaultdict
from datetime import datetime
from typing import Annotated

import fitz
from bson import ObjectId
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .database import analyses_collection, ping_mongodb
from .models import AnalysisRecordModel

app = FastAPI(title="CareerPath AI API (MongoDB)", version="0.3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store fallback if MongoDB instance is offline during local development
in_memory_db: list[dict] = []

SKILLS: dict[str, tuple[str, ...]] = {
    "Python": ("python",), "SQL": ("sql",), "JavaScript": ("javascript", "js"),
    "TypeScript": ("typescript",), "React": ("react",), "Node.js": ("node.js", "nodejs"),
    "FastAPI": ("fastapi",), "REST APIs": ("rest api", "restful api", "rest apis"),
    "Machine learning": ("machine learning", "ml"), "Deep learning": ("deep learning",),
    "NLP": ("natural language processing", "nlp"), "LLMs": ("llm", "llms", "large language model"),
    "RAG": ("retrieval augmented generation", "rag"), "LangChain": ("langchain",),
    "LangGraph": ("langgraph",), "PyTorch": ("pytorch",), "TensorFlow": ("tensorflow",),
    "scikit-learn": ("scikit-learn", "sklearn"), "Pandas": ("pandas",),
    "NumPy": ("numpy",), "Docker": ("docker",), "Kubernetes": ("kubernetes",),
    "AWS": ("aws", "amazon web services"), "Azure": ("azure",), "GCP": ("gcp", "google cloud"),
    "MongoDB": ("mongodb", "mongo db"), "PostgreSQL": ("postgresql", "postgres"),
    "Git": ("git", "github"), "CI/CD": ("ci/cd", "continuous integration", "continuous delivery"),
    "HTML/CSS": ("html", "css"), "Tailwind CSS": ("tailwind", "tailwind css"),
    "Data visualization": ("data visualization", "visualization"), "Communication": ("communication",),
    "Problem solving": ("problem solving", "problem-solving"),
    "Java": ("java",), "C++": ("c++", "cpp"), "C#": ("c#", "csharp"), "Go": ("golang", "go"),
    "Rust": ("rust",), "Django": ("django",), "Flask": ("flask",), "Next.js": ("next.js", "nextjs"),
    "Vue.js": ("vue", "vue.js"), "Angular": ("angular",), "Express": ("express", "express.js"),
    "GraphQL": ("graphql",), "Redis": ("redis",), "MySQL": ("mysql",), "Linux": ("linux", "unix"),
    "Flutter": ("flutter", "dart"), "System Design": ("system design",), "OOP": ("object oriented", "oop"),
}

LEARN: dict[str, tuple[str, str, str]] = {
    "Python": ("Python foundations", "Build a small command-line data tool", "Week 1"),
    "SQL": ("SQL querying and joins", "Analyze a public dataset with 10 useful queries", "Week 1"),
    "React": ("React components and state", "Build a responsive job tracker", "Week 2"),
    "FastAPI": ("FastAPI and request validation", "Expose your project through a documented API", "Week 2"),
    "REST APIs": ("REST API design", "Add pagination and error handling to an API", "Week 2"),
    "Machine learning": ("Supervised learning workflow", "Train and evaluate a baseline classifier", "Week 2"),
    "Deep learning": ("Neural network fundamentals", "Train a small model and explain its metrics", "Week 3"),
    "NLP": ("Text preprocessing and NLP", "Create a text classification notebook", "Week 3"),
    "LLMs": ("LLM prompting and evaluation", "Compare prompts on a small evaluation set", "Week 3"),
    "RAG": ("RAG retrieval and evaluation", "Build a cited Q&A tool over course notes", "Week 3"),
    "LangChain": ("LLM application orchestration", "Connect retrieval and an LLM in one workflow", "Week 3"),
    "LangGraph": ("Stateful agent workflows", "Create an agent with a planner and reviewer", "Week 4"),
    "Docker": ("Docker fundamentals", "Containerize your API and document how to run it", "Week 4"),
    "AWS": ("AWS deployment basics", "Deploy a small service and add a health check", "Week 4"),
    "MongoDB": ("MongoDB data modeling", "Store and retrieve user learning plans", "Week 4"),
    "PostgreSQL": ("Relational data modeling", "Design tables and queries for a job tracker", "Week 4"),
    "TypeScript": ("TypeScript for application code", "Type a reusable form and API client", "Week 2"),
    "PyTorch": ("PyTorch training loop", "Train a small model and track validation metrics", "Week 3"),
    "Java": ("Java fundamentals & OOP", "Build a backend CLI tool in Java", "Week 1"),
    "Django": ("Django web framework", "Build a full-stack REST API with Django", "Week 2"),
    "Next.js": ("Next.js SSR & React framework", "Build a full-stack Next.js app", "Week 2"),
    "Redis": ("Redis caching & key-value store", "Add caching layer to an API", "Week 3"),
    "Linux": ("Linux shell & CLI scripting", "Write bash automation scripts", "Week 1"),
    "System Design": ("Scalable System Design", "Design a distributed system architecture", "Week 4"),
}


COMMON_STOPWORDS = {
    "and", "or", "the", "a", "an", "in", "on", "at", "to", "for", "with", "by", "about",
    "against", "between", "into", "through", "during", "before", "after", "above", "below",
    "from", "up", "down", "of", "off", "over", "under", "again", "further", "then", "once",
    "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few",
    "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same",
    "so", "than", "too", "very", "can", "will", "just", "should", "now", "role", "job",
    "candidate", "experience", "work", "team", "looking", "developer", "engineer",
    "building", "required", "requirements", "skills", "responsibilities", "strong",
    "ability", "good", "knowledge", "working", "degree", "years", "seeking", "position",
    "senior", "junior", "lead", "staff", "full", "stack", "frontend", "backend", "software"
}


def extract_skills(text: str) -> list[str]:
    lowered = text.lower()
    found: list[str] = []

    # 1. Check catalog skills
    for skill, aliases in SKILLS.items():
        for alias in aliases:
            pattern = rf"(?<![a-z0-9+#]){re.escape(alias)}(?![a-z0-9+#])"
            if re.search(pattern, lowered):
                found.append(skill)
                break

    # 2. Dynamic extraction fallback & enrichment:
    # Extract capitalized technical words, frameworks, and tools directly from text
    words = re.findall(r'\b[A-Z][a-zA-Z0-9+#\.\-]{2,}\b', text)
    for w in words:
        clean = w.strip(".,;:()")
        if clean.lower() not in COMMON_STOPWORDS and clean not in found:
            found.append(clean)

    # 3. If still empty, extract significant words from text so we never return empty
    if not found:
        raw_words = re.findall(r'\b[a-zA-Z0-9+#\.\-]{3,}\b', text)
        for r in raw_words:
            if r.lower() not in COMMON_STOPWORDS:
                cap = r.capitalize()
                if cap not in found:
                    found.append(cap)
                    if len(found) >= 5:
                        break

    return list(dict.fromkeys(found))


def build_roadmap(gaps: list[str]) -> list[dict[str, str]]:
    buckets: dict[str, list[str]] = defaultdict(list)
    for skill in gaps:
        title, project, week = LEARN.get(
            skill, (f"Learn {skill}", f"Build a small portfolio example using {skill}", "Week 4")
        )
        buckets[week].append(f"{title} — {project}")
    return [{"week": week, "focus": "; ".join(items)} for week, items in sorted(buckets.items())]


def analyze(resume_text: str, job_description: str) -> dict:
    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_description)
    matched = [skill for skill in job_skills if skill in resume_skills]
    gaps = [skill for skill in job_skills if skill not in resume_skills]
    coverage = round(100 * len(matched) / len(job_skills)) if job_skills else 0
    return {
        "resume_skills": resume_skills,
        "job_skills": job_skills,
        "matched_skills": matched,
        "missing_skills": gaps,
        "coverage_percent": coverage,
        "roadmap": build_roadmap(gaps),
        "summary": (
            f"Your resume currently covers {len(matched)} of {len(job_skills)} skills detected in this role."
            if job_skills else "We could not detect catalog skills in the job description. Try including more role requirements."
        ),
    }


@app.get("/api/health")
@app.get("/api/health/")
@app.get("/health")
async def health() -> dict[str, Any]:
    mongo_status = await ping_mongodb()
    return {"status": "ok", "mongodb_connected": mongo_status}


@app.post("/api/analyze")
@app.post("/api/analyze/")
@app.post("/analyze")
async def analyze_documents(
    job_description: Annotated[str, Form()],
    resume_text: Annotated[str, Form()] = "",
    user_email: Annotated[str, Form()] = "",
    resume_file: Annotated[UploadFile | None, File()] = None,
) -> dict:
    filename = None
    if resume_file and resume_file.filename:
        filename = resume_file.filename
        if not resume_file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=415, detail="Upload a PDF resume or paste resume text.")
        try:
            pdf = fitz.open(stream=await resume_file.read(), filetype="pdf")
            resume_text = "\n".join(page.get_text() for page in pdf)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="This PDF could not be read. Try another file or paste its text.") from exc
    if not resume_text.strip():
        raise HTTPException(status_code=422, detail="Upload a PDF resume or paste resume text.")
    if len(job_description.strip()) < 3:
        raise HTTPException(status_code=422, detail="Please enter a job description.")

    result = analyze(resume_text, job_description)
    created_at_str = datetime.utcnow().isoformat()

    record_dict = {
        "user_email": user_email.strip() if user_email else None,
        "resume_filename": filename,
        "job_description": job_description,
        "resume_text": resume_text,
        "resume_skills": result["resume_skills"],
        "job_skills": result["job_skills"],
        "matched_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"],
        "coverage_percent": result["coverage_percent"],
        "roadmap": result["roadmap"],
        "summary": result["summary"],
        "created_at": created_at_str,
    }

    # Save to MongoDB or in-memory fallback if Mongo is offline
    is_connected = await ping_mongodb()
    if is_connected:
        res = await analyses_collection.insert_one(record_dict)
        doc_id = str(res.inserted_id)
    else:
        doc_id = f"mem-{len(in_memory_db) + 1}"
        record_dict["_id"] = doc_id
        in_memory_db.append(record_dict)

    response_data = result.copy()
    response_data["id"] = doc_id
    response_data["created_at"] = created_at_str
    return response_data


@app.get("/api/analyses")
async def list_analyses(user_email: str | None = None) -> list[dict]:
    is_connected = await ping_mongodb()
    query = {"user_email": user_email} if user_email else {}
    if is_connected:
        cursor = analyses_collection.find(query).sort("created_at", -1)
        docs = await cursor.to_list(length=100)
        return [AnalysisRecordModel.from_mongo(d).model_dump() for d in docs]
    else:
        filtered = [
            d for d in in_memory_db
            if not user_email or d.get("user_email") == user_email
        ]
        return [
            AnalysisRecordModel.from_mongo(d).model_dump()
            for d in reversed(filtered)
        ]


@app.get("/api/analyses/{analysis_id}")
async def get_analysis(analysis_id: str) -> dict:
    is_connected = await ping_mongodb()
    if is_connected:
        doc = None
        if ObjectId.is_valid(analysis_id):
            doc = await analyses_collection.find_one({"_id": ObjectId(analysis_id)})
        if not doc:
            doc = await analyses_collection.find_one({"_id": analysis_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Analysis record not found.")
        return AnalysisRecordModel.from_mongo(doc).model_dump()
    else:
        doc = next((d for d in in_memory_db if d.get("_id") == analysis_id), None)
        if not doc:
            raise HTTPException(status_code=404, detail="Analysis record not found.")
        return AnalysisRecordModel.from_mongo(doc).model_dump()


@app.delete("/api/analyses/{analysis_id}")
async def delete_analysis(analysis_id: str) -> dict:
    is_connected = await ping_mongodb()
    if is_connected:
        query = {"_id": ObjectId(analysis_id)} if ObjectId.is_valid(analysis_id) else {"_id": analysis_id}
        res = await analyses_collection.delete_one(query)
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Analysis record not found.")
        return {"status": "deleted", "id": analysis_id}
    else:
        global in_memory_db
        initial_len = len(in_memory_db)
        in_memory_db = [d for d in in_memory_db if d.get("_id") != analysis_id]
        if len(in_memory_db) == initial_len:
            raise HTTPException(status_code=404, detail="Analysis record not found.")
        return {"status": "deleted", "id": analysis_id}
