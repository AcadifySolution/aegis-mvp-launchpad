# Contributing

1. Create a focused branch.
2. Keep API, estimator, and UI changes separately testable.
3. Add regression tests for behavior changes.
4. Run the backend and frontend quality gates locally.
5. Never commit secrets, generated runtime data, or customer information.
6. Update README/docs when API contracts, deployment, or architecture changes.

## Backend

```bash
cd backend
pip install -r requirements.txt
pip install -r requirements-dev.txt
ruff check .
black --check .
pytest -q
```

## Frontend

```bash
cd frontend
npm ci
npm run build
```
