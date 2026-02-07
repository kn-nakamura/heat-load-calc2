from __future__ import annotations

from collections import defaultdict

from app.domain.aggregation import combine, major_cells_from_subtotals
from app.domain.internal_loads import calc_internal_load
from app.domain.reference_lookup import get_reference_repository
from app.domain.solar_gain import calc_opening_solar_gain
from app.domain.transmission import calc_surface_load
from app.domain.ventilation import calc_ventilation_load
from app.models.schemas import CalcResult, LoadVector, Project, RoomLoadSummary, SystemLoadSummary


def _select_design_condition(project: Project, season: str):
    for cond in project.design_conditions:
        if cond.season.value == season:
            return cond
    return None


def run_calculation(project: Project) -> CalcResult:
    refs = get_reference_repository()
    summer = _select_design_condition(project, "summer")
    winter = _select_design_condition(project, "winter")

    outdoor = refs.lookup_outdoor(project.region)
    constructions = {c.id: c for c in project.constructions}
    glasses = {g.id: g for g in project.glasses}

    traces = []
    room_results: list[RoomLoadSummary] = []
    all_major_cells: dict[str, float | None] = {}

    room_surface_map: dict[str, list] = defaultdict(list)
    room_opening_map: dict[str, list] = defaultdict(list)
    room_internal_map: dict[str, list] = defaultdict(list)
    room_vent_map: dict[str, list] = defaultdict(list)

    for s in project.surfaces:
        room_surface_map[s.room_id].append(s)
    for o in project.openings:
        room_opening_map[o.room_id].append(o)
    for i in project.internal_loads:
        room_internal_map[i.room_id].append(i)
    for v in project.ventilation_infiltration:
        room_vent_map[v.room_id].append(v)

    for room in project.rooms:
        external_vectors: list[LoadVector] = []
        internal_vectors: list[LoadVector] = []

        for surface in room_surface_map.get(room.id, []):
            vec, trace, group = calc_surface_load(
                surface=surface,
                room=room,
                summer_condition=summer,
                winter_condition=winter,
                constructions=constructions,
                references=refs,
                region=project.region,
                outdoor=outdoor,
            )
            traces.append(trace)
            (external_vectors if group == "external" else internal_vectors).append(vec)

        for opening in room_opening_map.get(room.id, []):
            vec, trace, group = calc_opening_solar_gain(
                opening=opening,
                glasses=glasses,
                references=refs,
                region=project.region,
            )
            traces.append(trace)
            (external_vectors if group == "external" else internal_vectors).append(vec)

        for internal_load in room_internal_map.get(room.id, []):
            vec, trace, group = calc_internal_load(internal_load)
            traces.append(trace)
            (external_vectors if group == "external" else internal_vectors).append(vec)

        for vent in room_vent_map.get(room.id, []):
            vec, trace, group = calc_ventilation_load(
                vent=vent,
                room=room,
                summer_condition=summer,
                winter_condition=winter,
                outdoor=outdoor,
                references=refs,
            )
            traces.append(trace)
            (external_vectors if group == "external" else internal_vectors).append(vec)

        external_total = combine(external_vectors)
        internal_total = combine(internal_vectors)

        correction = project.metadata.correction_factors
        major_cells = major_cells_from_subtotals(external_total, internal_total, room.area_m2, correction)

        pre = external_total.add(internal_total)
        post = LoadVector(
            cool_9=float(major_cells.get("R53") or 0.0),
            cool_12=float(major_cells.get("X53") or 0.0),
            cool_14=float(major_cells.get("AB53") or 0.0),
            cool_16=float(major_cells.get("AF53") or 0.0),
            cool_latent=float(major_cells.get("N53") or 0.0),
            heat_sensible=float(major_cells.get("AL53") or 0.0),
            heat_latent=float(major_cells.get("AJ53") or 0.0),
        )
        final_totals = {
            "cool_9_total": float(major_cells.get("R54") or 0.0),
            "cool_12_total": float(major_cells.get("X54") or 0.0),
            "cool_14_total": float(major_cells.get("AB54") or 0.0),
            "cool_16_total": float(major_cells.get("AF54") or 0.0),
            "heating_total": float(major_cells.get("AJ54") or 0.0),
        }

        all_major_cells = major_cells
        room_results.append(
            RoomLoadSummary(
                room_id=room.id,
                room_name=room.name,
                external=external_total,
                internal=internal_total,
                pre_correction=pre,
                post_correction=post,
                final_totals=final_totals,
            )
        )

    system_results: list[SystemLoadSummary] = []
    room_result_map = {r.room_id: r for r in room_results}
    for system in project.systems:
        totals = {
            "cool_9_total": 0.0,
            "cool_12_total": 0.0,
            "cool_14_total": 0.0,
            "cool_16_total": 0.0,
            "heating_total": 0.0,
        }
        for rid in system.room_ids:
            rr = room_result_map.get(rid)
            if not rr:
                continue
            for k in totals:
                totals[k] += rr.final_totals.get(k, 0.0)
        system_results.append(
            SystemLoadSummary(
                system_id=system.id,
                system_name=system.name,
                room_ids=system.room_ids,
                totals=totals,
            )
        )

    totals = {
        "cool_9_total": sum(r.final_totals["cool_9_total"] for r in room_results),
        "cool_12_total": sum(r.final_totals["cool_12_total"] for r in room_results),
        "cool_14_total": sum(r.final_totals["cool_14_total"] for r in room_results),
        "cool_16_total": sum(r.final_totals["cool_16_total"] for r in room_results),
        "heating_total": sum(r.final_totals["heating_total"] for r in room_results),
    }

    return CalcResult(
        major_cells=all_major_cells,
        room_results=room_results,
        system_results=system_results,
        totals=totals,
        traces=traces,
    )
