from __future__ import annotations

from collections import Counter

from app.models.schemas import Project, ValidationIssue, ValidationLevel


def _duplicate_issues(entity_name: str, items: list, key: str = "id") -> list[ValidationIssue]:
    values = [getattr(item, key) for item in items]
    counts = Counter(values)
    duplicates = [v for v, c in counts.items() if c > 1]
    issues: list[ValidationIssue] = []
    for dup in duplicates:
        issues.append(
            ValidationIssue(
                level=ValidationLevel.ERROR,
                code="duplicate_id",
                message=f"{entity_name} に重複IDがあります: {dup}",
                entity=entity_name,
                field=key,
            )
        )
    return issues


def validate_project(project: Project) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []

    issues.extend(_duplicate_issues("rooms", project.rooms))
    issues.extend(_duplicate_issues("surfaces", project.surfaces))
    issues.extend(_duplicate_issues("openings", project.openings))
    issues.extend(_duplicate_issues("constructions", project.constructions))
    issues.extend(_duplicate_issues("glasses", project.glasses))
    issues.extend(_duplicate_issues("internal_loads", project.internal_loads))
    issues.extend(_duplicate_issues("mechanical_loads", project.mechanical_loads))
    issues.extend(_duplicate_issues("ventilation", project.ventilation_infiltration))
    issues.extend(_duplicate_issues("systems", project.systems))

    room_ids = {room.id for room in project.rooms}
    construction_ids = {x.id for x in project.constructions}
    glass_ids = {x.id for x in project.glasses}
    surface_ids = {x.id for x in project.surfaces}
    system_ids = {x.id for x in project.systems}

    for room in project.rooms:
        if room.system_id and room.system_id not in system_ids:
            issues.append(
                ValidationIssue(
                    level=ValidationLevel.ERROR,
                    code="reference_not_found",
                    message=f"room.system_id が systems に存在しません: {room.system_id}",
                    entity="rooms",
                    field="system_id",
                )
            )

    for surface in project.surfaces:
        if surface.room_id not in room_ids:
            issues.append(
                ValidationIssue(
                    level=ValidationLevel.ERROR,
                    code="reference_not_found",
                    message=f"surface.room_id が rooms に存在しません: {surface.room_id}",
                    entity="surfaces",
                    field="room_id",
                )
            )
        if surface.construction_id and surface.construction_id not in construction_ids:
            issues.append(
                ValidationIssue(
                    level=ValidationLevel.ERROR,
                    code="reference_not_found",
                    message=f"surface.construction_id が constructions に存在しません: {surface.construction_id}",
                    entity="surfaces",
                    field="construction_id",
                )
            )

    for opening in project.openings:
        if opening.room_id not in room_ids:
            issues.append(
                ValidationIssue(
                    level=ValidationLevel.ERROR,
                    code="reference_not_found",
                    message=f"opening.room_id が rooms に存在しません: {opening.room_id}",
                    entity="openings",
                    field="room_id",
                )
            )
        if opening.surface_id and opening.surface_id not in surface_ids:
            issues.append(
                ValidationIssue(
                    level=ValidationLevel.ERROR,
                    code="reference_not_found",
                    message=f"opening.surface_id が surfaces に存在しません: {opening.surface_id}",
                    entity="openings",
                    field="surface_id",
                )
            )
        if opening.glass_id and opening.glass_id not in glass_ids:
            issues.append(
                ValidationIssue(
                    level=ValidationLevel.ERROR,
                    code="reference_not_found",
                    message=f"opening.glass_id が glasses に存在しません: {opening.glass_id}",
                    entity="openings",
                    field="glass_id",
                )
            )

    for load in project.internal_loads:
        if load.room_id not in room_ids:
            issues.append(
                ValidationIssue(
                    level=ValidationLevel.ERROR,
                    code="reference_not_found",
                    message=f"internal_load.room_id が rooms に存在しません: {load.room_id}",
                    entity="internal_loads",
                    field="room_id",
                )
            )

    for load in project.mechanical_loads:
        if load.room_id not in room_ids:
            issues.append(
                ValidationIssue(
                    level=ValidationLevel.ERROR,
                    code="reference_not_found",
                    message=f"mechanical_load.room_id が rooms に存在しません: {load.room_id}",
                    entity="mechanical_loads",
                    field="room_id",
                )
            )

    for vent in project.ventilation_infiltration:
        if vent.room_id not in room_ids:
            issues.append(
                ValidationIssue(
                    level=ValidationLevel.ERROR,
                    code="reference_not_found",
                    message=f"ventilation.room_id が rooms に存在しません: {vent.room_id}",
                    entity="ventilation",
                    field="room_id",
                )
            )

    if not project.rooms:
        issues.append(
            ValidationIssue(
                level=ValidationLevel.WARN,
                code="empty_project",
                message="rooms が0件です。",
                entity="project",
            )
        )

    return issues
