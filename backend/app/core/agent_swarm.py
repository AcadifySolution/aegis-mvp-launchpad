import queue
import threading
import time
from typing import Dict, List

from app.core.config import MAX_PROJECT_LOGS
from app.db.mock_db import db
from app.schemas.mvp import (
    APIEndpoint,
    BudgetMilestone,
    DBSchema,
    FinancialEstimate,
    MVPEstimateResult,
    SwarmLog,
    TechSpec,
    UserStory,
)


class SwarmEventManager:
    def __init__(self):
        self._queues: Dict[str, List[queue.Queue]] = {}
        self._lock = threading.Lock()

    def subscribe(self, project_id: str) -> queue.Queue:
        with self._lock:
            q = queue.Queue(maxsize=500)
            self._queues.setdefault(project_id, []).append(q)
            return q

    def unsubscribe(self, project_id: str, q: queue.Queue) -> None:
        with self._lock:
            queues = self._queues.get(project_id, [])
            if q in queues:
                queues.remove(q)
            if not queues:
                self._queues.pop(project_id, None)

    def publish(self, project_id: str, event_type: str, data: dict) -> None:
        with self._lock:
            for q in list(self._queues.get(project_id, [])):
                try:
                    q.put_nowait({"type": event_type, "data": data})
                except queue.Full:
                    # Slow clients must not block the swarm worker.
                    try:
                        q.get_nowait()
                        q.put_nowait({"type": event_type, "data": data})
                    except queue.Empty:
                        pass


event_manager = SwarmEventManager()


def execute_swarm_task(
    project_id: str,
    description: str,
    platforms: List[str],
    expected_timeline: int,
):
    time.sleep(1.0)
    project = db.get_project(project_id)
    if not project:
        return

    def log_and_publish(agent: str, message: str):
        log_entry = SwarmLog(agent=agent, message=message, timestamp=time.time())
        project.logs.append(log_entry)
        if len(project.logs) > MAX_PROJECT_LOGS:
            project.logs = project.logs[-MAX_PROJECT_LOGS:]
        db.update_project(project)
        event_manager.publish(project_id, "log", log_entry.model_dump())
        time.sleep(0.8)

    # Existing PM / architecture / finance orchestration remains below.
    # ...
