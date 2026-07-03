from pydantic import BaseModel, Field
from typing import List, Optional

class MVPEstimateRequest(BaseModel):
    name: Optional[str] = Field(default="My MVP Project", description="Optional custom name of the project")
    description: str = Field(..., min_length=20, description="Detailed description of the MVP idea and features")
    target_platforms: List[str] = Field(default_factory=lambda: ["Web"], description="List of target platforms (e.g. Web, Mobile, Desktop)")
    expected_timeline_weeks: int = Field(default=8, ge=4, le=24, description="Target timeline for development in weeks")

class SwarmLog(BaseModel):
    agent: str = Field(..., description="The name of the agent (e.g. Product Manager, System Architect, Financial Analyst)")
    message: str = Field(..., description="Log description or agent thought block")
    timestamp: float = Field(..., description="Unix timestamp of the log creation")

class UserStory(BaseModel):
    id: str
    title: str
    description: str
    priority: str = Field(..., description="Priority: Must-Have, Should-Have, Nice-to-Have")
    estimated_hours: int

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
    percentage: int
    amount: float
    completed: bool = False

class FinancialEstimate(BaseModel):
    total_hours: int
    hourly_rate: float
    total_cost: float
    timeline_weeks: int
    team_size: int
    milestones: List[BudgetMilestone]

class MVPEstimateResult(BaseModel):
    id: str
    name: str
    description: str
    status: str = Field("processing", description="processing, completed, failed")
    user_stories: List[UserStory] = Field(default_factory=list)
    tech_spec: Optional[TechSpec] = None
    financials: Optional[FinancialEstimate] = None
    logs: List[SwarmLog] = Field(default_factory=list)
    created_at: float

class BacklogUpdateRequest(BaseModel):
    story_ids_priority: List[str] = Field(..., description="Ordered list of story IDs reflecting priority order")
    hourly_rate: Optional[float] = None
    team_size: Optional[int] = None
