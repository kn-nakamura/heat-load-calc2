# Development

## Backend

```bash
cd backend
pip install -e .[dev]
# Optional: normalize bundled reference_data metadata (no Excel required)
python scripts/extract_reference_tables.py
uvicorn app.main:app --reload --port 8000
pytest
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```
