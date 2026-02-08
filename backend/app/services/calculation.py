from __future__ import annotations

from collections import defaultdict

from app.domain.aggregation import combine, major_cells_from_subtotals
from app.domain.internal_loads import calc_internal_load
from app.domain.mechanical_loads import calc_mechanical_load
from app.domain.reference_lookup import get_reference_repository
from app.domain.solar_gain import calc_opening_solar_gain
from app.domain.transmission import calc_surface_load
from app.domain.ventilation import calc_ventilation_load
from app.models.schemas import CalcResult, DesignCondition, LoadVector, Project, RoomLoadSummary, SystemLoadSummary


def _find_design_condition(project: Project, condition_id: str | None) -> DesignCondition | None:
    if not condition_id:
        return None
    for cond in project.design_conditions:
        if cond.id == condition_id:
            return cond
    return None


def run_calculation(project: Project) -> CalcResult:
    refs = get_reference_repository()

    # Build condition map by id
    condition_map: dict[str, DesignCondition] = {}
    for cond in project.design_conditions:
        condition_map[cond.id] = cond

    # Use first condition as default if available
    default_condition = project.design_conditions[0] if project.design_conditions else None

    outdoor = refs.lookup_outdoor(project.region)
    solar_region = project.solar_region or project.region
    constructions = {c.id: c for c in project.constructions}
    glasses = {g.id: g for g in project.glasses}

    traces = []
    room_results: list[RoomLoadSummary] = []
    all_major_cells: dict[str, float | None] = {}

    room_surface_map: dict[str, list] = defaultdict(list)
    room_opening_map: dict[str, list] = defaultdict(list)
    room_internal_map: dict[str, list] = defaultdict(list)
    room_mechanical_map: dict[str, list] = defaultdict(list)
    room_vent_map: dict[str, list] = defaultdict(list)

    for s in project.surfaces:
        room_surface_map[s.room_id].append(s)
    for o in project.openings:
        room_opening_map[o.room_id].append(o)
    for i in project.internal_loads:
        room_internal_map[i.room_id].append(i)
    for m in project.mechanical_loads:
        room_mechanical_map[m.room_id].append(m)
    for v in project.ventilation_infiltration:
        room_vent_map[v.room_id].append(v)

    for room in project.rooms:
        # Look up the unified design condition for this room
        room_condition = condition_map.get(room.design_condition_id or "") or default_condition

        # The new unified DesignCondition is passed as both summer and winter
        # Domain modules now access summer_drybulb_c, winter_drybulb_c etc. directly

        envelope_by_orientation: dict[str, LoadVector] = defaultdict(lambda: LoadVector())
        internal_vectors: list[LoadVector] = []
        ventilation_vectors: list[LoadVector] = []

        for surface in room_surface_map.get(room.id, []):
            vec, trace, group = calc_surface_load(
                surface=surface,
                room=room,
                summer_condition=room_condition,
                winter_condition=room_condition,
                constructions=constructions,
                references=refs,
                region=project.region,
                outdoor=outdoor,
            )
            traces.append(trace)
            orientation = surface.orientation or "N"
            envelope_by_orientation[orientation] = envelope_by_orientation[orientation].add(vec)

        for opening in room_opening_map.get(room.id, []):
            vec, trace, group = calc_opening_solar_gain(
                opening=opening,
                glasses=glasses,
                references=refs,
                region=solar_region,
                design_condition=room_condition,
                outdoor=outdoor,
            )
            traces.append(trace)
            orientation = opening.orientation or "N"
            envelope_by_orientation[orientation] = envelope_by_orientation[orientation].add(vec)

        for internal_load in room_internal_map.get(room.id, []):
            vec, trace, group = calc_internal_load(
                internal_load,
                project.metadata.rounding.occupancy,
                heat_mode=True
            )
            traces.append(trace)
            internal_vectors.append(vec)

        for mechanical_load in room_mechanical_map.get(room.id, []):
            vec, trace, group = calc_mechanical_load(mechanical_load, heat_mode=True)
            traces.append(trace)
            internal_vectors.append(vec)

        for vent in room_vent_map.get(room.id, []):
            vec, trace, group = calc_ventilation_load(
                vent=vent,
                room=room,
                summer_condition=room_condition,
                winter_condition=room_condition,
                outdoor=outdoor,
                references=refs,
                outdoor_air_rounding=project.metadata.rounding.outdoor_air,
            )
            traces.append(trace)
            ventilation_vectors.append(vec)

        envelope_total = sum(envelope_by_orientation.values(), LoadVector())
        internal_total = combine(internal_vectors)
        ventilation_total = combine(ventilation_vectors)

        cooling_total = envelope_total.add(internal_total).add(ventilation_total)

        correction = project.metadata.correction_factors
        major_cells = major_cells_from_subtotals(
            envelope_total,
            internal_total,
            ventilation_total,
            room.area_m2,
            correction,
        )

        pre = cooling_total
        post = LoadVector(
            cool_9=float(major_cells.get("R55") or 0.0),
            cool_12=float(major_cells.get("X55") or 0.0),
            cool_14=float(major_cells.get("AB55") or 0.0),
            cool_16=float(major_cells.get("AF55") or 0.0),
            cool_latent=float(major_cells.get("N55") or 0.0),
            heat_sensible=float(major_cells.get("AL55") or 0.0),
            heat_latent=float(major_cells.get("AJ55") or 0.0),
        )
        final_totals = {
            "cool_9_total": float(major_cells.get("R56") or 0.0),
            "cool_12_total": float(major_cells.get("X56") or 0.0),
            "cool_14_total": float(major_cells.get("AB56") or 0.0),
            "cool_16_total": float(major_cells.get("AF56") or 0.0),
            "heating_total": float(major_cells.get("AJ56") or 0.0),
        }

        all_major_cells = major_cells
        room_results.append(
            RoomLoadSummary(
                room_id=room.id,
                room_name=room.name,
                envelope_loads=envelope_total,
                envelope_loads_by_orientation=dict(envelope_by_orientation),
                internal_loads=internal_total,
                ventilation_loads=ventilation_total,
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
