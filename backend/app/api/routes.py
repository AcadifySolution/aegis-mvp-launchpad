import uuid
import time
import json
import queue
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from app.db.mock_db import db
from app.schemas.mvp import (
    MVPEstimateRequest, MVPEstimateResult,
    BacklogUpdateRequest, FinancialEstimate, BudgetMilestone
)
from app.core.agent_swarm import event_manager, start_estimation_swarm

router = APIRouter(prefix="/api/mvps")

@router.get("", response_model=list[MVPEstimateResult])
def get_all_projects():
    """Retrieve all MVP project evaluations in reverse chronological order."""
    return db.list_projects()

@router.get("/{project_id}", response_model=MVPEstimateResult)
def get_project(project_id: str):
    """Retrieve details of a specific MVP project."""
    project = db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="MVP Project not found")
    return project

@router.post("", response_model=MVPEstimateResult)
def create_project_estimate(request: MVPEstimateRequest):
    """
    Creates a new MVP estimation tracker and spawns the background Agent Swarm.
    """
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
        created_at=time.time()
    )
    
    db.create_project(project)
    
    # Trigger background agent swarm execution
    start_estimation_swarm(
        project_id=project_id,
        description=request.description,
        platforms=request.target_platforms,
        expected_timeline=request.expected_timeline_weeks
    )
    
    return project

@router.get("/{project_id}/stream")
def stream_project_swarm(project_id: str):
    """
    Establish a Server-Sent Events (SSE) stream to receive live log feeds
    and incremental specs compiled by the AI agent swarm.
    """
    project = db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="MVP Project not found")

    def event_generator():
        # Get subscriber queue
        q = event_manager.subscribe(project_id)
        
        # Stream current logs and state first so the client can catch up
        proj_state = db.get_project(project_id)
        if proj_state:
            yield f"event: init\ndata: {proj_state.model_dump_json()}\n\n"

        try:
            while True:
                try:
                    event = q.get(timeout=1.5)
                    yield f"event: {event['type']}\ndata: {json.dumps(event['data'])}\n\n"
                    if event["type"] == "complete":
                        break
                except queue.Empty:
                    # Connection keep-alive
                    yield ": keepalive\n\n"
                    
                    # Verify if background thread has already ended
                    current_project = db.get_project(project_id)
                    if current_project and current_project.status in ["completed", "failed"]:
                        break
        finally:
            event_manager.unsubscribe(project_id, q)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.patch("/{project_id}/backlog", response_model=MVPEstimateResult)
def update_project_backlog(project_id: str, update: BacklogUpdateRequest):
    """
    Allows clients to customize user story priorities, hourly rates, or team size,
    instantly recalculating the budget, milestones, and timeline.
    """
    project = db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="MVP Project not found")
        
    if project.status == "processing":
        raise HTTPException(status_code=400, detail="Cannot alter specs while agent swarm is processing")

    # Reorder user stories according to story_ids_priority and update their priority classes
    story_map = {s.id: s for s in project.user_stories}
    reordered_stories = []
    
    total_stories = len(update.story_ids_priority)
    for idx, sid in enumerate(update.story_ids_priority):
        if sid in story_map:
            story = story_map[sid]
            # Simple priority heuristic based on user placement
            if idx < total_stories * 0.4:
                story.priority = "Must-Have"
            elif idx < total_stories * 0.75:
                story.priority = "Should-Have"
            else:
                story.priority = "Nice-to-Have"
            reordered_stories.append(story)
            
    # Include any missing stories that were not sent in the payload (defense-in-depth)
    for sid, story in story_map.items():
        if story not in reordered_stories:
            reordered_stories.append(story)
            
    project.user_stories = reordered_stories
    
    # Recalculate financials
    current_financials = project.financials
    if current_financials:
        new_hourly_rate = update.hourly_rate or current_financials.hourly_rate
        new_team_size = update.team_size or current_financials.team_size
        
        # Base hours are computed from user stories
        total_hours = sum(s.estimated_hours for s in project.user_stories)
        total_cost = total_hours * new_hourly_rate
        
        # Recalculate delivery duration
        avg_hours_per_week = 35 * new_team_size
        timeline_weeks = max(4, int(total_hours / avg_hours_per_week) + 1)
        
        # Recalculate Milestones
        milestones = [
            BudgetMilestone(name="Requirements & Specs (20%)", percentage=20, amount=total_cost * 0.20, completed=True),
            BudgetMilestone(name="Core Prototype Build (50%)", percentage=50, amount=total_cost * 0.50, completed=False),
            BudgetMilestone(name="QA, Integration & Launch (30%)", percentage=30, amount=total_cost * 0.30, completed=False)
        ]
        
        project.financials = FinancialEstimate(
            total_hours=total_hours,
            hourly_rate=new_hourly_rate,
            total_cost=total_cost,
            timeline_weeks=timeline_weeks,
            team_size=new_team_size,
            milestones=milestones
        )

    db.update_project(project)
    return project
