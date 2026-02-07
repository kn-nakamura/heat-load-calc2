from __future__ import annotations

import csv
import io
from collections import Counter
from pathlib import Path

from app.models.schemas import (
    ConstructionAssembly,
    CsvImportRequest,
    ImportApplyResponse,
    ImportDiff,
    ImportPreviewResponse,
    InternalLoad,
    Opening,
    PasteImportRequest,
    Project,
    Room,
    Surface,
    ValidationIssue,
    ValidationLevel,
    VentilationInfiltration,
)
from app.services.column_aliases import ALIAS_MAPS, DATASET_TO_ENTITY
from app.services.validation import validate_project


def _norm(text: str) -> str:
    return text.strip().lower().replace(" ", "")


def _to_number(v: str) -> float | str:
    raw = v.strip()
    if raw == "":
        return ""
    try:
        if "." in raw:
            return float(raw)
        return float(int(raw))
    except ValueError:
        return raw


def _canonical_field(entity: str, header: str) -> str | None:
    normalized = _norm(header)
    for field, aliases in ALIAS_MAPS[entity].items():
        for alias in aliases:
            if _norm(alias) == normalized:
                return field
    return None


def _parse_table(entity: str, text: str, has_header: bool) -> tuple[list[dict], list[ValidationIssue]]:
    issues: list[ValidationIssue] = []
    lines = [line for line in text.replace("\r\n", "\n").split("\n") if line.strip()]
    if not lines:
        return [], issues

    sample = lines[0]
    delimiter = "\t" if "\t" in sample else ","
    reader = csv.reader(io.StringIO("\n".join(lines)), delimiter=delimiter)
    rows = list(reader)

    headers: list[str]
    body_rows: list[list[str]]
    if has_header:
        headers = rows[0]
        body_rows = rows[1:]
    else:
        canonical = list(ALIAS_MAPS[entity].keys())
        headers = canonical[: len(rows[0])]
        body_rows = rows

    mapped_headers = []
    for h in headers:
        canon = _canonical_field(entity, h)
        mapped_headers.append(canon)

    for idx, canon in enumerate(mapped_headers):
        if canon is None:
            issues.append(
                ValidationIssue(
                    level=ValidationLevel.WARN,
                    code="unknown_column",
                    message=f"未知の列を無視します: {headers[idx]}",
                    entity=entity,
                    col=idx + 1,
                )
            )

    records: list[dict] = []
    for row_idx, row in enumerate(body_rows, start=2 if has_header else 1):
        record: dict = {}
        for col_idx, raw in enumerate(row):
            if col_idx >= len(mapped_headers):
                continue
            key = mapped_headers[col_idx]
            if key is None:
                continue
            val = _to_number(raw)
            if val == "":
                continue
            record[key] = val
        if record:
            records.append(record)
        else:
            issues.append(
                ValidationIssue(
                    level=ValidationLevel.WARN,
                    code="empty_row",
                    message="空行をスキップしました。",
                    entity=entity,
                    row=row_idx,
                )
            )

    required = {"id"}
    if entity in {"surfaces", "openings", "internal_loads", "ventilation"}:
        required.add("room_id")

    for i, rec in enumerate(records, start=1):
        missing = sorted([field for field in required if field not in rec])
        for field in missing:
            issues.append(
                ValidationIssue(
                    level=ValidationLevel.ERROR,
                    code="missing_required",
                    message=f"必須列が不足しています: {field}",
                    entity=entity,
                    field=field,
                    row=i,
                )
            )

    ids = [str(r.get("id")) for r in records if "id" in r]
    dup_ids = [x for x, c in Counter(ids).items() if c > 1]
    for dup in dup_ids:
        issues.append(
            ValidationIssue(
                level=ValidationLevel.ERROR,
                code="duplicate_id",
                message=f"取り込み内でID重複: {dup}",
                entity=entity,
                field="id",
            )
        )

    return records, issues


def _dataset_entity_from_filename(filename: str) -> str | None:
    stem = Path(filename).stem.lower()
    for key, entity in DATASET_TO_ENTITY.items():
        if key in stem:
            return entity
    return None


def _default_project() -> Project:
    return Project(id="new-project", name="新規プロジェクト", region="東京")


def _upsert_list(current: list, incoming: list[dict], model_cls, delete_missing: bool) -> tuple[list, ImportDiff]:
    by_id = {str(x.id): x for x in current}
    incoming_ids = set()
    add = 0
    update = 0

    for rec in incoming:
        rec_id = str(rec["id"])
        incoming_ids.add(rec_id)
        if rec_id in by_id:
            merged = by_id[rec_id].model_dump()
            merged.update(rec)
            by_id[rec_id] = model_cls.model_validate(merged)
            update += 1
        else:
            by_id[rec_id] = model_cls.model_validate(rec)
            add += 1

    delete = 0
    if delete_missing:
        for rec_id in list(by_id.keys()):
            if rec_id not in incoming_ids:
                del by_id[rec_id]
                delete += 1

    return list(by_id.values()), ImportDiff(entity=model_cls.__name__.lower(), add=add, update=update, delete=delete)


def preview_csv_import(req: CsvImportRequest) -> ImportPreviewResponse:
    project = req.project or _default_project()
    issues: list[ValidationIssue] = []
    diffs: list[ImportDiff] = []

    for ds in req.datasets:
        entity = _dataset_entity_from_filename(ds.filename)
        if not entity:
            issues.append(
                ValidationIssue(
                    level=ValidationLevel.WARN,
                    code="dataset_skipped",
                    message=f"対象外ファイルをスキップしました: {ds.filename}",
                )
            )
            continue

        records, parse_issues = _parse_table(entity, ds.content, req.has_header)
        issues.extend(parse_issues)

        current = getattr(project, "ventilation_infiltration" if entity == "ventilation" else entity)
        current_ids = {str(x.id) for x in current}
        incoming_ids = [str(r.get("id")) for r in records if "id" in r]

        add = sum(1 for rid in incoming_ids if rid not in current_ids)
        update = sum(1 for rid in incoming_ids if rid in current_ids)
        delete = max(len(current_ids - set(incoming_ids)), 0) if req.delete_missing else 0
        diffs.append(ImportDiff(entity=entity, add=add, update=update, delete=delete))

    return ImportPreviewResponse(diffs=diffs, issues=issues)


def apply_csv_import(req: CsvImportRequest) -> ImportApplyResponse:
    project = req.project or _default_project()
    preview = preview_csv_import(req)
    issues = list(preview.issues)

    if any(i.level == ValidationLevel.ERROR for i in issues):
        return ImportApplyResponse(project=project, diffs=preview.diffs, issues=issues)

    from app.models.schemas import GlassSpec

    model_map = {
        "rooms": Room,
        "surfaces": Surface,
        "openings": Opening,
        "constructions": ConstructionAssembly,
        "glasses": GlassSpec,
        "internal_loads": InternalLoad,
        "ventilation": VentilationInfiltration,
    }

    applied_diffs: list[ImportDiff] = []

    for ds in req.datasets:
        entity = _dataset_entity_from_filename(ds.filename)
        if not entity:
            continue
        records, _ = _parse_table(entity, ds.content, req.has_header)
        if entity == "ventilation":
            current = project.ventilation_infiltration
            updated, diff = _upsert_list(current, records, model_map[entity], req.delete_missing)
            project.ventilation_infiltration = updated
        else:
            current = getattr(project, entity)
            updated, diff = _upsert_list(current, records, model_map[entity], req.delete_missing)
            setattr(project, entity, updated)
        diff.entity = entity
        applied_diffs.append(diff)

    issues.extend(validate_project(project))
    return ImportApplyResponse(project=project, diffs=applied_diffs, issues=issues)


def preview_paste_import(req: PasteImportRequest) -> ImportPreviewResponse:
    project = req.project or _default_project()
    fake = CsvImportRequest(
        project=project,
        datasets=[{"filename": f"{req.entity}.csv", "content": req.text}],
        has_header=req.has_header,
        allow_headerless=not req.has_header,
        delete_missing=req.delete_missing,
    )
    return preview_csv_import(fake)


def apply_paste_import(req: PasteImportRequest) -> ImportApplyResponse:
    project = req.project or _default_project()
    fake = CsvImportRequest(
        project=project,
        datasets=[{"filename": f"{req.entity}.csv", "content": req.text}],
        has_header=req.has_header,
        allow_headerless=not req.has_header,
        delete_missing=req.delete_missing,
    )
    return apply_csv_import(fake)
