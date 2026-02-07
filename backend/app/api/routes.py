from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from app.models.schemas import (
    CalcRunRequest,
    CsvImportRequest,
    ExcelExportRequest,
    ImportApplyResponse,
    ImportPreviewResponse,
    JsonExportRequest,
    JsonExportResponse,
    JsonImportRequest,
    PasteImportRequest,
    Project,
    NearestRegionResponse,
    ReferenceTableResponse,
    ValidateResponse,
)
from app.services.calculation import run_calculation
from app.services.excel_export import export_excel
from app.services.importers import apply_csv_import, apply_paste_import, preview_csv_import, preview_paste_import
from app.services.json_io import export_project_json, import_project_json
from app.services.reference import get_nearest_region, get_reference_table
from app.services.validation import validate_project

router = APIRouter()


@router.post("/projects/validate", response_model=ValidateResponse)
def validate_project_endpoint(project: Project) -> ValidateResponse:
    issues = validate_project(project)
    valid = not any(i.level == "error" for i in issues)
    return ValidateResponse(valid=valid, issues=issues)


@router.post("/calc/run")
def calc_run_endpoint(req: CalcRunRequest):
    issues = validate_project(req.project)
    if any(i.level == "error" for i in issues):
        raise HTTPException(status_code=400, detail={"issues": [i.model_dump() for i in issues]})
    result = run_calculation(req.project)
    return result


@router.post("/import/csv/preview", response_model=ImportPreviewResponse)
def csv_preview_endpoint(req: CsvImportRequest):
    return preview_csv_import(req)


@router.post("/import/csv/apply", response_model=ImportApplyResponse)
def csv_apply_endpoint(req: CsvImportRequest):
    return apply_csv_import(req)


@router.post("/import/paste/preview", response_model=ImportPreviewResponse)
def paste_preview_endpoint(req: PasteImportRequest):
    return preview_paste_import(req)


@router.post("/import/paste/apply", response_model=ImportApplyResponse)
def paste_apply_endpoint(req: PasteImportRequest):
    return apply_paste_import(req)


@router.post("/import/json")
def json_import_endpoint(req: JsonImportRequest):
    project = import_project_json(req)
    issues = validate_project(project)
    return {"project": project, "issues": issues}


@router.post("/export/json", response_model=JsonExportResponse)
def json_export_endpoint(req: JsonExportRequest):
    calc = req.calc_result.model_dump() if req.calc_result else None
    return export_project_json(req.project, calc)


@router.post("/export/excel")
def excel_export_endpoint(req: ExcelExportRequest):
    payload = export_excel(req.project, req.calc_result)
    filename = req.output_filename
    return Response(
        content=payload,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/reference/nearest_region", response_model=NearestRegionResponse)
def nearest_region_endpoint(
    lat: float = Query(..., description="Latitude in decimal degrees."),
    lon: float = Query(..., description="Longitude in decimal degrees."),
    tag: str | None = Query("solar_gain", description="Optional tag filter (e.g. solar_gain, design_outdoor)."),
):
    record = get_nearest_region(lat, lon, tag)
    if not record:
        raise HTTPException(status_code=404, detail="No region coordinates available.")
    return NearestRegionResponse(
        region=str(record.get("region", "")),
        lat=float(record.get("lat", 0.0)),
        lon=float(record.get("lon", 0.0)),
        distance_km=float(record.get("distance_km", 0.0)),
        tags=list(record.get("tags", [])),
    )


@router.get("/reference/{table_name}", response_model=ReferenceTableResponse)
def reference_endpoint(table_name: str):
    try:
        data = get_reference_table(table_name)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return ReferenceTableResponse(table_name=table_name, data=data)
