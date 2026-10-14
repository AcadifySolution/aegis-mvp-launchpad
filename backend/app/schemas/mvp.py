from pydantic import BaseModel, Field

from app.core.config import MAX_DESCRIPTION_LENGTH


class MVPEstimateRequest(BaseModel):
    name: str | None = Field(default="My MVP Project", max_length=200)
    description: str = Field(
        ...,
        min_length=20,
        max_length=MAX_DESCRIPTION_LENGTH,
        description="Detailed description of the MVP idea and features",
    )
    target_platforms: list[str] = Field(
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
    columns: list[str]


class TechSpec(BaseModel):
    languages: list[str]
    frontend: list[str]
    backend: list[str]
    database: str
    hosting: str
    endpoints: list[APIEndpoint]
    schemas: list[DBSchema]


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
    milestones: list[BudgetMilestone]


class MVPEstimateResult(BaseModel):
    id: str
    name: str
    description: str
    status: str = Field("processing")
    user_stories: list[UserStory] = Field(default_factory=list)
    tech_spec: TechSpec | None = None
    financials: FinancialEstimate | None = None
    logs: list[SwarmLog] = Field(default_factory=list)
    created_at: float


class BacklogUpdateRequest(BaseModel):
    story_ids_priority: list[str] = Field(..., min_length=1, max_length=500)
    hourly_rate: float | None = Field(default=None, gt=0, le=100_000)
    team_size: int | None = Field(default=None, ge=1, le=100)
