# Heat Load Calc Backend

FastAPI service for heat load calculation MVP.

## Run

```bash
pip install -e .[dev]
uvicorn app.main:app --reload --port 8000
```

## Key endpoints

- `POST /v1/projects/validate`
- `POST /v1/calc/run`
- `POST /v1/import/csv/preview`
- `POST /v1/import/csv/apply`
- `POST /v1/import/paste/preview`
- `POST /v1/import/paste/apply`
- `POST /v1/import/json`
- `POST /v1/export/json`
- `POST /v1/export/excel`
- `GET /v1/reference/{table_name}`

## Reference data

Reference tables are stored in `reference_data/`.
You can normalize or refresh JSON metadata (no Excel workbook required):

```bash
python scripts/extract_reference_tables.py
```
