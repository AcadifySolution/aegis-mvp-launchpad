import threading

from app.schemas.mvp import MVPEstimateResult


class MockDB:
    def __init__(self):
        self._projects: dict[str, MVPEstimateResult] = {}
        self._lock = threading.Lock()

    def get_project(self, project_id: str) -> MVPEstimateResult | None:
        with self._lock:
            return self._projects.get(project_id)

    def create_project(self, project: MVPEstimateResult) -> None:
        with self._lock:
            self._projects[project.id] = project

    def update_project(self, project: MVPEstimateResult) -> None:
        with self._lock:
            if project.id in self._projects:
                self._projects[project.id] = project

    def list_projects(self) -> list[MVPEstimateResult]:
        with self._lock:
            return sorted(
                self._projects.values(), key=lambda p: p.created_at, reverse=True
            )

    def delete_project(self, project_id: str) -> bool:
        with self._lock:
            if project_id in self._projects:
                del self._projects[project_id]
                return True
            return False

    def clear(self) -> None:
        with self._lock:
            self._projects.clear()


# Global database instance
db = MockDB()
