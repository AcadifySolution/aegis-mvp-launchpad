import time
import queue
import threading
from typing import Dict, List, Optional
from app.db.mock_db import db
from app.schemas.mvp import (
    MVPEstimateResult, SwarmLog, UserStory,
    APIEndpoint, DBSchema, TechSpec,
    BudgetMilestone, FinancialEstimate
)

class SwarmEventManager:
    def __init__(self):
        self._queues: Dict[str, List[queue.Queue]] = {}
        self._lock = threading.Lock()

    def subscribe(self, project_id: str) -> queue.Queue:
        with self._lock:
            q = queue.Queue()
            if project_id not in self._queues:
                self._queues[project_id] = []
            self._queues[project_id].append(q)
            return q

    def unsubscribe(self, project_id: str, q: queue.Queue) -> None:
        with self._lock:
            if project_id in self._queues:
                self._queues[project_id].remove(q)
                if not self._queues[project_id]:
                    del self._queues[project_id]

    def publish(self, project_id: str, event_type: str, data: dict) -> None:
        with self._lock:
            if project_id in self._queues:
                for q in self._queues[project_id]:
                    q.put({"type": event_type, "data": data})

# Global manager for streaming events
event_manager = SwarmEventManager()

def execute_swarm_task(project_id: str, description: str, platforms: List[str], expected_timeline: int):
    """
    Executes the collaborative agent swarm workflow in a background thread,
    simulating detailed AI agent thoughts, logs, and technical calculations.
    """
    time.sleep(1.0) # Grace period for client to connect to SSE stream
    
    project = db.get_project(project_id)
    if not project:
        return

    def log_and_publish(agent: str, message: str):
        log_entry = SwarmLog(agent=agent, message=message, timestamp=time.time())
        project.logs.append(log_entry)
        db.update_project(project)
        event_manager.publish(project_id, "log", log_entry.model_dump())
        time.sleep(0.8) # Delay to simulate realistic streaming progress

    # --- Phase 1: Product Manager Agent ---
    log_and_publish("Product Manager", "Spawning agent. Scope description ingestion successful.")
    log_and_publish("Product Manager", f"Analyzing MVP feasibility for platforms: {', '.join(platforms)}.")
    log_and_publish("Product Manager", "Extracting core features and creating user stories...")
    
    # Generate mock backlog based on user description keywords
    desc_lower = description.lower()
    user_stories = []
    
    # Common stories
    user_stories.append(UserStory(
        id="US-1",
        title="User Authentication & Profiles",
        description="As a user, I want to sign up securely, create my profile, and log in with JWT credentials.",
        priority="Must-Have",
        estimated_hours=24
    ))
    
    if "health" in desc_lower or "tracker" in desc_lower or "fitbit" in desc_lower:
        user_stories.append(UserStory(
            id="US-2",
            title="Integrate Fitbit API & Synchronize Metrics",
            description="As a client, I want secure OAuth integration with Fitbit to pull step and heart rate logs daily.",
            priority="Must-Have",
            estimated_hours=40
        ))
        user_stories.append(UserStory(
            id="US-3",
            title="Activity Summary Dashboard",
            description="As a user, I want to see daily visual charts summarizing my calories burned and active hours.",
            priority="Must-Have",
            estimated_hours=32
        ))
        user_stories.append(UserStory(
            id="US-4",
            title="Secure Doctor Report Sharing",
            description="As a patient, I want to compile a PDF summary of my data and export it securely via email.",
            priority="Should-Have",
            estimated_hours=20
        ))
        user_stories.append(UserStory(
            id="US-5",
            title="AI Health Coach Recommendations",
            description="As a premium user, I want tailored weekly AI health summaries based on my Fitbit telemetry.",
            priority="Nice-to-Have",
            estimated_hours=48
        ))
    else:
        # Generic SaaS stories
        user_stories.append(UserStory(
            id="US-2",
            title="Interactive Workspace & Dashboard",
            description="As an operator, I want to view my metrics, filter graphs, and see live dashboard alerts.",
            priority="Must-Have",
            estimated_hours=36
        ))
        user_stories.append(UserStory(
            id="US-3",
            title="CRUD Resource Manager API",
            description="As a customer, I want to create, read, update, and delete workspaces and settings.",
            priority="Must-Have",
            estimated_hours=28
        ))
        user_stories.append(UserStory(
            id="US-4",
            title="Billing & Payment Gateway",
            description="As an administrator, I want to configure payment cards and pay via Stripe integration.",
            priority="Should-Have",
            estimated_hours=32
        ))
        user_stories.append(UserStory(
            id="US-5",
            title="AI-Powered Context Summarizer",
            description="As a user, I want automated summaries of workspace interactions using an LLM.",
            priority="Nice-to-Have",
            estimated_hours=40
        ))

    project.user_stories = user_stories
    db.update_project(project)
    event_manager.publish(project_id, "stories", [s.model_dump() for s in user_stories])
    log_and_publish("Product Manager", "Backlog defined. Spawning System Architect to design system layout...")

    # --- Phase 2: System Architect Agent ---
    log_and_publish("System Architect", "Ingesting backlog items and checking architectural specifications...")
    log_and_publish("System Architect", "Selecting best-practice tech stack for MVP speed-to-market...")
    
    # Technology Stack details
    languages = ["TypeScript", "Python"]
    frontend_stack = ["React", "Tailwind CSS", "Vite"]
    backend_stack = ["FastAPI", "Uvicorn"]
    database = "PostgreSQL (with Prisma ORM)"
    hosting = "AWS ECS + Vercel"
    
    log_and_publish("System Architect", f"Tech Stack Selected: Front: {', '.join(frontend_stack)} | Back: {', '.join(backend_stack)} | DB: {database}.")
    log_and_publish("System Architect", "Mapping REST API schema and endpoint definitions...")

    endpoints = [
        APIEndpoint(path="/api/auth/register", method="POST", description="Register a new user profile"),
        APIEndpoint(path="/api/auth/login", method="POST", description="Validate credentials and issue JWT"),
        APIEndpoint(path="/api/dashboard/summary", method="GET", description="Fetch aggregated dashboard analytics")
    ]
    if "health" in desc_lower or "tracker" in desc_lower or "fitbit" in desc_lower:
        endpoints.append(APIEndpoint(path="/api/sync/fitbit", method="POST", description="Trigger Fitbit OAuth token check and fetch data"))
        endpoints.append(APIEndpoint(path="/api/coach/insights", method="GET", description="Get AI health suggestions"))
    else:
        endpoints.append(APIEndpoint(path="/api/workspaces", method="GET", description="List user workspaces"))
        endpoints.append(APIEndpoint(path="/api/ai/summarize", method="POST", description="Trigger LLM document summation"))

    log_and_publish("System Architect", "Drafting system relational database schemas...")
    schemas = [
        DBSchema(table_name="users", columns=["id (UUID)", "email (VARCHAR)", "password_hash (VARCHAR)", "created_at (TIMESTAMP)"]),
        DBSchema(table_name="profiles", columns=["id (UUID)", "user_id (UUID)", "full_name (VARCHAR)", "avatar_url (VARCHAR)"])
    ]
    if "health" in desc_lower or "tracker" in desc_lower or "fitbit" in desc_lower:
        schemas.append(DBSchema(table_name="fitbit_credentials", columns=["id (UUID)", "user_id (UUID)", "access_token (TEXT)", "refresh_token (TEXT)", "expires_at (TIMESTAMP)"]))
        schemas.append(DBSchema(table_name="activity_logs", columns=["id (UUID)", "user_id (UUID)", "log_date (DATE)", "steps (INT)", "calories (INT)", "heart_rate_avg (INT)"]))
    else:
        schemas.append(DBSchema(table_name="workspaces", columns=["id (UUID)", "user_id (UUID)", "name (VARCHAR)", "config_json (JSONB)"]))
        schemas.append(DBSchema(table_name="transactions", columns=["id (UUID)", "user_id (UUID)", "amount (DECIMAL)", "status (VARCHAR)", "stripe_charge_id (VARCHAR)"]))

    tech_spec = TechSpec(
        languages=languages,
        frontend=frontend_stack,
        backend=backend_stack,
        database=database,
        hosting=hosting,
        endpoints=endpoints,
        schemas=schemas
    )
    
    project.tech_spec = tech_spec
    db.update_project(project)
    event_manager.publish(project_id, "tech_spec", tech_spec.model_dump())
    log_and_publish("System Architect", "Architecture blueprints created. Invoking Financial Analyst...")

    # --- Phase 3: Financial Analyst Agent ---
    log_and_publish("Financial Analyst", "Calculating financial projections and milestones...")
    
    # Calculate sum of story hours
    total_hours = sum(s.estimated_hours for s in user_stories)
    hourly_rate = 75.0 # Base enterprise/agency hourly rate
    total_cost = total_hours * hourly_rate
    
    # Timeline heuristics
    team_size = 2
    avg_hours_per_week = 35 * team_size
    computed_weeks = max(4, int(total_hours / avg_hours_per_week) + 1)
    
    # Overwrite timeline if request specified something reasonable
    timeline_weeks = min(computed_weeks, expected_timeline)
    
    # Standard Milestones
    milestones = [
        BudgetMilestone(name="Requirements & Specs (20%)", percentage=20, amount=total_cost * 0.20, completed=True),
        BudgetMilestone(name="Core Prototype Build (50%)", percentage=50, amount=total_cost * 0.50, completed=False),
        BudgetMilestone(name="QA, Integration & Launch (30%)", percentage=30, amount=total_cost * 0.30, completed=False)
    ]
    
    financials = FinancialEstimate(
        total_hours=total_hours,
        hourly_rate=hourly_rate,
        total_cost=total_cost,
        timeline_weeks=timeline_weeks,
        team_size=team_size,
        milestones=milestones
    )
    
    project.financials = financials
    project.status = "completed"
    db.update_project(project)
    
    event_manager.publish(project_id, "financials", financials.model_dump())
    log_and_publish("Financial Analyst", f"Calculations finalized. Estimated Cost: ${total_cost:,.2f} | Duration: {timeline_weeks} Weeks.")
    
    # Final check
    event_manager.publish(project_id, "complete", project.model_dump())

def start_estimation_swarm(project_id: str, description: str, platforms: List[str], expected_timeline: int):
    t = threading.Thread(
        target=execute_swarm_task,
        args=(project_id, description, platforms, expected_timeline),
        daemon=True
    )
    t.start()
