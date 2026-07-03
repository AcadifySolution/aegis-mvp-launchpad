import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.mock_db import db
from app.schemas.mvp import MVPEstimateResult, UserStory, FinancialEstimate, BudgetMilestone

client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    # Clear DB before each test
    db.clear()
    yield

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "aegis-backend"}

def test_create_project_estimate_validation():
    # Short description should fail validation (min_length=20)
    invalid_payload = {
        "name": "Quick App",
        "description": "Too short",
        "target_platforms": ["Web"]
    }
    response = client.post("/api/mvps", json=invalid_payload)
    assert response.status_code == 422

    # Valid payload should succeed and return a processing state
    valid_payload = {
        "name": "SaaS Platform",
        "description": "Build an enterprise portal with authentication, dashboards, and role management.",
        "target_platforms": ["Web", "Mobile"],
        "expected_timeline_weeks": 10
    }
    response = client.post("/api/mvps", json=valid_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "SaaS Platform"
    assert data["status"] == "processing"
    assert "id" in data

def test_database_crud():
    project = MVPEstimateResult(
        id="test-id",
        name="Mock Project",
        description="A mocked project for testing database functionality",
        status="completed",
        user_stories=[],
        tech_spec=None,
        financials=None,
        logs=[],
        created_at=1234567.0
    )
    db.create_project(project)
    
    assert db.get_project("test-id") is not None
    assert len(db.list_projects()) == 1
    
    project.name = "Updated Mock Project"
    db.update_project(project)
    assert db.get_project("test-id").name == "Updated Mock Project"

    db.delete_project("test-id")
    assert db.get_project("test-id") is None

def test_backlog_recalculation():
    # Setup completed project in DB
    stories = [
        UserStory(id="story-1", title="Feature A", description="Desc A", priority="Must-Have", estimated_hours=10),
        UserStory(id="story-2", title="Feature B", description="Desc B", priority="Should-Have", estimated_hours=20)
    ]
    financials = FinancialEstimate(
        total_hours=30,
        hourly_rate=50.0,
        total_cost=1500.0,
        timeline_weeks=4,
        team_size=1,
        milestones=[
            BudgetMilestone(name="Milestone 1", percentage=100, amount=1500.0, completed=False)
        ]
    )
    project = MVPEstimateResult(
        id="test-recalc",
        name="Recalc Project",
        description="Testing mathematical recalculations of stories",
        status="completed",
        user_stories=stories,
        tech_spec=None,
        financials=financials,
        logs=[],
        created_at=123456.0
    )
    db.create_project(project)

    # Perform PATCH request updating rate and sorting (e.g. swap priority)
    update_payload = {
        "story_ids_priority": ["story-2", "story-1"],
        "hourly_rate": 100.0, # Double the rate
        "team_size": 2 # Double team size should reduce timeline
    }
    
    response = client.patch("/api/mvps/test-recalc/backlog", json=update_payload)
    assert response.status_code == 200
    
    data = response.json()
    # Cost should double (30 hours * $100 = $3000)
    assert data["financials"]["total_cost"] == 3000.0
    assert data["financials"]["hourly_rate"] == 100.0
    assert data["financials"]["team_size"] == 2
    # Verify stories reordered
    assert data["user_stories"][0]["id"] == "story-2"
    assert data["user_stories"][1]["id"] == "story-1"
