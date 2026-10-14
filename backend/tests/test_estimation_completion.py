from app.core import agent_swarm
from app.db.mock_db import db
from app.schemas.mvp import MVPEstimateResult


def test_estimation_completes_and_publishes_result(monkeypatch):
    db.clear()
    project = MVPEstimateResult(
        id="completion",
        name="Example",
        description="A dashboard for a small business",
        created_at=0,
    )
    db.create_project(project)
    events = []
    monkeypatch.setattr(agent_swarm.time, "sleep", lambda _: None)
    monkeypatch.setattr(agent_swarm, "MAX_PROJECT_LOGS", 3)
    monkeypatch.setattr(
        agent_swarm.event_manager, "publish", lambda _, kind, data: events.append(kind)
    )
    agent_swarm.execute_swarm_task(project.id, project.description, ["Web"], 8)
    result = db.get_project(project.id)
    assert result.status == "completed"
    assert result.user_stories and result.tech_spec and result.financials
    assert (
        result.financials.total_cost
        == result.financials.total_hours * result.financials.hourly_rate
    )
    assert len(result.logs) <= 3
    assert events[-1] == "complete"
    assert {"stories", "tech_spec", "financials"}.issubset(events)
    db.clear()
