from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class RoadmapItem(BaseModel):
    week: str
    focus: str


class AnalysisRecordModel(BaseModel):
    id: str | None = None
    user_email: str | None = None
    resume_filename: str | None = None
    job_description: str
    resume_text: str
    resume_skills: list[str] = Field(default_factory=list)
    job_skills: list[str] = Field(default_factory=list)
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    coverage_percent: int = 0
    roadmap: list[RoadmapItem] = Field(default_factory=list)
    summary: str
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_mongo_dict(self) -> dict[str, Any]:
        data = self.model_dump(exclude={"id"})
        return data

    @classmethod
    def from_mongo(cls, doc: dict[str, Any]) -> "AnalysisRecordModel":
        doc_id = str(doc.get("_id"))
        return cls(
            id=doc_id,
            user_email=doc.get("user_email"),
            resume_filename=doc.get("resume_filename"),
            job_description=doc.get("job_description", ""),
            resume_text=doc.get("resume_text", ""),
            resume_skills=doc.get("resume_skills", []),
            job_skills=doc.get("job_skills", []),
            matched_skills=doc.get("matched_skills", []),
            missing_skills=doc.get("missing_skills", []),
            coverage_percent=doc.get("coverage_percent", 0),
            roadmap=[RoadmapItem(**item) for item in doc.get("roadmap", [])],
            summary=doc.get("summary", ""),
            created_at=doc.get("created_at", datetime.utcnow().isoformat()),
        )
