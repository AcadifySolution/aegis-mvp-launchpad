import json
import queue
import time
import uuid

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.config import API_KEY
from app.db.mock_db import db
from app.core.config import MAX_PROJECT_LOGS
from app.schemas.mvp import (
    BacklogUpdateRequest,
    FinancialEstimate,
    BudgetMilestone,
    MVPEstimateRequest,
    MVPEstimateResult,
)
from app.core.agent_swarm import event_manager, start_estimation_swarm

router = APIRouter(prefix="/api/mvps")


def require_api_key(x_api_key: str | None) -> None:
    """Require an API key when one is configured for the deployment."""
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key.")


@router.get("", response_model=list[MVPEstimateResult])
def get_all_projects(
    x_api_key: str | None = Header(default=None),
    limit: int = Query(default=50, ge=1, le=200),
):
    require_api_key(x_api_key)
    return db.list_projects()[:limit]


@router.get("/{project_id}", response_model=MVPEstimateResult)
def get_project(
    project_id: str,
    x_api_key: str | None = Header(default=None),
):
    require_api_key(x_api_key)
    project = db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="MVP Project not found")
    return project


@router.post("", response_model=MVPEstimateResult)
def create_project_estimate(
    request: MVPEstimateRequest,
    x_api_key: str | None = Header(default=None),
):
    require_api_key(x_api_key)

    project_id = str(uuid.uuid4())
    project = MVPEstimateResult(
        id=project_id,
        name=request.name or "MVP Project",
        description=request.description,
        status="processing",
        user_stories=[],
        tech_spec=None,
        financials=None,
        logs=[],
        created_at=time.time(),
    )
    db.create_project(project)
    start_estimation_swarm(
        project_id=project_id,
        description=request.description,
        platforms=request.target_platforms,
        expected_timeline=request.expected_timeline_weeks,
    )
    return project


@router.get("/{project_id}/stream")
def stream_project_swarm(
    project_id: str,
    x_api_key: str | None = Header(default=None),
):
    require_api_key(x_api_key)

    project = db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="MVP Project not found")

    def event_generator():
        q = event_manager.subscribe(project_id)
        proj_state = db.get_project(project_id)
        if proj_state:
            yield f"event: init\ndata: {proj_state.model_dump_json()}\n\n"

        try:
            while True:
                try:
                    event = q.get(timeout=1.5)
                    yield (
                        f"event: {event['type']}\n"
                        f"data: {json.dumps(event['data'])}\n\n"
                    )
                    if event["type"] == "complete":
                        break
                except queue.Empty:
                    yield ": keepalive\n\n"
                    current_project = db.get_project(project_id)
                    if current_project and current_project.status in {"completed", "failed"}:
                        break
        finally:
            event_manager.unsubscribe(project_id, q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.patch("/{project_id}/backlog", response_model=MVPEstimateResult)
def update_project_backlog(
    project_id: str,
    update: BacklogUpdateRequest,
    x_api_key: str | None = Header(default=None),
):
    require_api_key(x_api_key)

    project = db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="MVP Project not found")
    if project.status == "processing":
        raise HTTPException(
            status_code=400,
            detail="Cannot alter specs while agent swarm is processing",
        )

    story_map = {s.id: s for s in project.user_stories}
    reordered_stories = []
    total_stories = len(update.story_ids_priority)

    for idx, sid in enumerate(update.story_ids_priority):
        if sid in story_map:
            story = story_map[sid]
            if idx < total_stories * 0.4:
                story.priority = "Must-Have"
            elif idx < total_stories * 0.75:
                story.priority = "Should-Have"
            else:
                story.priority = "Nice-to-Have"
            reordered_stories.append(story)

    for sid, story in story_map.items():
        if story not in reordered_stories:
            reordered_stories.append(story)

    project.user_stories = reordered_stories

    if project.financials:
        new_hourly_rate = update.hourly_rate or project.financials.hourly_rate
        new_team_size = update.team_size or project.financials.team_size
        total_hours = sum(s.estimated_hours for s in project.user_stories)
        total_cost = total_hours * new_hourly_rate
        avg_hours_per_week = 35 * new_team_size
        timeline_weeks = max(4, int(total_hours / avg_hours_per_week) + 1)

        project.financials = FinancialEstimate(
            total_hours=total_hours,
            hourly_rate=new_hourly_rate,
            total_cost=total_cost,
            timeline_weeks=timeline_weeks,
            team_size=new_team_size,
            milestones=[
                BudgetMilestone(
                    name="Requirements & Specs (20%)",
                    percentage=20,
                    amount=total_cost * 0.20,
                    completed=True,
                ),
                BudgetMilestone(
                    name="Core Prototype Build (50%)",
                    percentage=50,
                    amount=total_cost * 0.50,
                    completed=False,
                ),
                BudgetMilestone(
                    name="QA, Integration & Launch (30%)",
                    percentage=30,
                    amount=total_cost * 0.30,
                    completed=False,
                ),
            ],
        )

    db.update_project(project)
    return project
