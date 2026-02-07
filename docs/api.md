# API Overview

## Endpoints

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

## Notes

- All calculation logic is implemented in Python backend.
- Excel formula evaluation is not performed on server.
- Excel output keeps template formatting/formulas and sets `fullCalcOnLoad`.
