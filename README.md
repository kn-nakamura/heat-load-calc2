# heat-load-calc

Web application MVP for building heat-load calculation based on MLIT-style Excel logic.

This repository contains:
- `backend/`: FastAPI + Python calculation engine
- `frontend/`: React + Vite + AG Grid wizard UI
- `docs/`: API and development documentation

## 1. Overview

This app provides an end-to-end workflow:
1. Define project and design conditions
2. Input room/surface/opening/load data
3. Import bulk data (CSV / JSON / Excel copy-paste TSV)
4. Run backend heat-load calculation
5. Review results and calculation trace
6. Export JSON and Excel output

## 2. MVP scope

Included:
- Frontend/backend separation
- 9-step wizard UI
- Core data model (Project, Room, Surface, Opening, etc.)
- CSV/JSON/paste import preview + apply
- Calculation trace output (`formula_id`, inputs, references, intermediates, output)
- Excel export with template-clone strategy and `fullCalcOnLoad=True`

Not included:
- Authentication/authorization
- IFC importer implementation (planned extension point)
- DB persistence (JSON-centric workflow for MVP)
- Server-side Excel formula evaluation

## 3. Runtime dependencies

### 3.1 Reference data
- Runtime uses bundled JSON files in `backend/reference_data/`.
- Runtime does **not** require the original `ver3.0` specification workbook.
- `backend/scripts/extract_reference_tables.py` normalizes bundled reference JSON metadata and does not require Excel.

### 3.2 Excel export
- `/v1/export/excel` requires the template workbook placed in repository root.
- If the template file is missing, Excel export will fail.

## 4. Repository structure

```text
.
- backend/
  - app/
    - api/
    - config/
    - domain/
    - models/
    - services/
  - reference_data/
  - scripts/
  - tests/
- frontend/
  - src/
- docs/
```

## 5. Backend quick start

```bash
cd backend
pip install -e .[dev]
python scripts/extract_reference_tables.py
uvicorn app.main:app --reload --port 8000
```

Health check:
- `GET http://localhost:8000/health`

## 6. Frontend quick start

```bash
cd frontend
npm install
npm run dev
```

Default local URL:
- `http://localhost:5173`

## 7. API summary

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

See `docs/api.md` for details.

## 8. Testing

```bash
cd backend
python -m pytest
```

If `pytest`/`httpx` are missing, install backend dev dependencies first.

## 9. Known limitations

- Example parity checks are currently fixture-driven for major cells.
- IFC import is not implemented yet.
- CSV/PDF export outside required JSON/Excel flow is not finalized.
- Persistence is file-based (JSON), not DB-based.

## 10. Recommended first-run flow

1. Start backend
2. Start frontend
3. Input or import project data
4. Run calculation
5. Review trace and totals
6. Export JSON and Excel

## 11. Deployment

This application can be deployed with:
- **Frontend**: Vercel (or any static hosting)
- **Backend**: Railway (or any Python hosting)

**Important**: You must configure environment variables for production deployment.

See detailed deployment instructions:
- `docs/deployment.md` - Complete deployment guide with environment variable setup

Quick setup:
1. **Railway**: Set `CORS_ORIGINS` to your Vercel frontend URL
2. **Vercel**: Set `VITE_API_URL` to your Railway backend URL
3. Redeploy both services after setting environment variables

## 12. Next planned extensions

- IFC importer module
- Stronger full-range parity tests
- DB-backed project storage
- Auth integration

---

See also:
- `docs/deployment.md`
- `docs/development.md`
- `docs/rounding.md`
