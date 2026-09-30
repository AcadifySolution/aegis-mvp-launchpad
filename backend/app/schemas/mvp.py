from pydantic import BaseModel, Field
from typing import List, Optional

from app.core.config import MAX_DESCRIPTION_LENGTH


class MVPEstimateRequest(BaseModel):
    name: Optional[str] = Field(default="My MVP Project", max_length=200)
    description: str = Field(
        ...,
        min_length=20,
        max_length=MAX_DESCRIPTION_LENGTH,
        description="Detailed description of the MVP idea and features",
    )
    target_platforms: List[str] = Field(
        default_factory=lambda: ["Web"],
        min_length=1,
        max_length=8,
    )
    expected_timeline_weeks: int = Field(
        default=8,
        ge=4,
        le=24,
        description="Target timeline for development in weeks",
    )


class SwarmLog(BaseModel):
    agent: str
    message: str = Field(..., max_length=2000)
    timestamp: float


class UserStory(BaseModel):
    id: str
    title: str
    description: str
    priority: str
    estimated_hours: int = Field(..., ge=0, le=10_000)


class APIEndpoint(BaseModel):
    path: str
    method: str
    description: str


class DBSchema(BaseModel):
    table_name: str
    columns: List[str]


class TechSpec(BaseModel):
    languages: List[str]
    frontend: List[str]
    backend: List[str]
    database: str
    hosting: str
    endpoints: List[APIEndpoint]
    schemas: List[DBSchema]


class BudgetMilestone(BaseModel):
    name: str
    percentage: int = Field(..., ge=0, le=100)
    amount: float = Field(..., ge=0)
    completed: bool = False


class FinancialEstimate(BaseModel):
    total_hours: int = Field(..., ge=0)
    hourly_rate: float = Field(..., ge=0)
    total_cost: float = Field(..., ge=0)
    timeline_weeks: int = Field(..., ge=1, le=104)
    team_size: int = Field(..., ge=1, le=100)
    milestones: List[BudgetMilestone]


class MVPEstimateResult(BaseModel):
    id: str
    name: str
    description: str
    status: str = Field("processing")
    user_stories: List[UserStory] = Field(default_factory=list)
    tech_spec: Optional[TechSpec] = None
    financials: Optional[FinancialEstimate] = None
    logs: List[SwarmLog] = Field(default_factory=list)
    created_at: float


class BacklogUpdateRequest(BaseModel):
    story_ids_priority: List[str] = Field(..., min_length=1, max_length=500)
    hourly_rate: Optional[float] = Field(default=None, gt=0, le=100_000)
    team_size: Optional[int] = Field(default=None, ge=1, le=100)
