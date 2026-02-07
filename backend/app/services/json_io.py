from __future__ import annotations

from app.models.schemas import JsonExportResponse, JsonImportRequest, Project


def import_project_json(req: JsonImportRequest) -> Project:
    return Project.model_validate(req.payload)


def export_project_json(project: Project, calc_result: dict | None = None) -> JsonExportResponse:
    payload = {
        "project": project.model_dump(),
    }
    if calc_result is not None:
        payload["calc_result"] = calc_result
    return JsonExportResponse(payload=payload)
