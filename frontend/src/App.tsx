import { useMemo, useState } from "react";
import type { ColDef, ValueParserParams } from "ag-grid-community";
import StepNav from "./components/StepNav";
import GridEditor from "./components/GridEditor";
import ResultPanel from "./components/ResultPanel";
import BulkImportPanel from "./components/BulkImportPanel";
import { exportExcel, exportJson, runCalculation, validateProject } from "./api/client";
import type {
  CalcResult,
  DesignCondition,
  Opening,
  Project,
  Room,
  Surface,
  SystemEntity
} from "./types";

const steps = [
  "Project Basics",
  "Design Conditions",
  "Region Data",
  "Openings",
  "Surfaces",
  "Rooms",
  "Systems",
  "Calculation",
  "Export"
];

const defaultProject: Project = {
  id: "project-1",
  name: "New Heat Load Project",
  unit_system: "SI",
  region: "Tokyo",
  orientation_basis: "north",
  design_conditions: [
    { id: "dc-summer", season: "summer", indoor_temp_c: 24, indoor_rh_pct: 45 },
    { id: "dc-winter", season: "winter", indoor_temp_c: 19, indoor_rh_pct: 40 }
  ],
  rooms: [],
  surfaces: [],
  openings: [],
  constructions: [],
  glasses: [],
  internal_loads: [],
  ventilation_infiltration: [],
  systems: [],
  metadata: {
    correction_factors: {
      cool_9: 1.1,
      cool_12: 1.1,
      cool_14: 1.1,
      cool_16: 1.1,
      cool_latent: 1.0,
      heat_sensible: 1.1,
      heat_latent: 1.0
    }
  }
};

const numberValueParser = (params: ValueParserParams): number | undefined => {
  const raw = params.newValue;
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : undefined;
  }
  const value = String(raw).trim();
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const createEmptyDesignCondition = () =>
  ({
    id: "",
    season: "",
    indoor_temp_c: "",
    indoor_rh_pct: ""
  } as unknown as DesignCondition);

const createEmptyRoom = () =>
  ({
    id: "",
    name: "",
    usage: "",
    floor: "",
    area_m2: "",
    ceiling_height_m: "",
    system_id: ""
  } as unknown as Room);

const createEmptySurface = () =>
  ({
    id: "",
    room_id: "",
    kind: "",
    orientation: "",
    area_m2: "",
    construction_id: ""
  } as unknown as Surface);

const createEmptyOpening = () =>
  ({
    id: "",
    room_id: "",
    surface_id: "",
    orientation: "",
    area_m2: "",
    glass_id: "",
    shading_sc: ""
  } as unknown as Opening);

const createEmptySystem = () =>
  ({
    id: "",
    name: "",
    room_ids: ""
  } as unknown as SystemEntity);

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, filename);
}

export default function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [project, setProject] = useState<Project>(defaultProject);
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [issues, setIssues] = useState<Array<{ message: string; level: string }>>([]);
  const [busy, setBusy] = useState(false);

  const roomColumns = useMemo<ColDef<Room>[]>(
    () => [
      { field: "id", headerName: "ID" },
      { field: "name", headerName: "Room Name" },
      { field: "usage", headerName: "Usage" },
      { field: "floor", headerName: "Floor" },
      { field: "area_m2", headerName: "Area [m2]", valueParser: numberValueParser },
      { field: "ceiling_height_m", headerName: "Ceiling H [m]", valueParser: numberValueParser },
      { field: "system_id", headerName: "System ID" }
    ],
    []
  );

  const surfaceColumns = useMemo<ColDef<Surface>[]>(
    () => [
      { field: "id", headerName: "ID" },
      { field: "room_id", headerName: "Room ID" },
      {
        field: "kind",
        headerName: "Kind",
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["wall", "roof", "floor", "internal"] }
      },
      { field: "orientation", headerName: "Orientation" },
      { field: "area_m2", headerName: "Area [m2]", valueParser: numberValueParser },
      { field: "construction_id", headerName: "Construction ID" }
    ],
    []
  );

  const openingColumns = useMemo<ColDef<Opening>[]>(
    () => [
      { field: "id", headerName: "ID" },
      { field: "room_id", headerName: "Room ID" },
      { field: "surface_id", headerName: "Surface ID" },
      { field: "orientation", headerName: "Orientation" },
      { field: "area_m2", headerName: "Area [m2]", valueParser: numberValueParser },
      { field: "glass_id", headerName: "Glass ID" },
      { field: "shading_sc", headerName: "SC", valueParser: numberValueParser }
    ],
    []
  );

  const systemColumns = useMemo<ColDef<SystemEntity>[]>(
    () => [
      { field: "id", headerName: "System ID" },
      { field: "name", headerName: "Name" },
      { field: "room_ids", headerName: "Room IDs (comma separated)" }
    ],
    []
  );

  const designColumns = useMemo<ColDef<DesignCondition>[]>(
    () => [
      { field: "id", headerName: "ID" },
      {
        field: "season",
        headerName: "Season",
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["summer", "winter"] }
      },
      { field: "indoor_temp_c", headerName: "Indoor Temp [C]", valueParser: numberValueParser },
      { field: "indoor_rh_pct", headerName: "Indoor RH [%]", valueParser: numberValueParser }
    ],
    []
  );

  const onRunCalc = async () => {
    setBusy(true);
    try {
      const validation = await validateProject(project);
      setIssues(validation.issues || []);
      if (!validation.valid) {
        return;
      }
      const result = await runCalculation(project);
      setCalcResult(result);
    } finally {
      setBusy(false);
    }
  };

  const onExportJson = async () => {
    setBusy(true);
    try {
      const payload = await exportJson(project, calcResult);
      downloadJson(payload, "project.json");
    } finally {
      setBusy(false);
    }
  };

  const onExportExcel = async () => {
    setBusy(true);
    try {
      const blob = await exportExcel(project, calcResult);
      downloadBlob(blob, "heat_load_result.xlsx");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <StepNav steps={steps} currentStep={stepIndex} issuesCount={issues.length} onSelectStep={setStepIndex} />
      <main className="main-panel">
        <header>
          <h2>{steps[stepIndex]}</h2>
          <p>Spreadsheet-like web input: direct edit, copy/paste from Excel, add/delete rows.</p>
        </header>

        <BulkImportPanel project={project} onProjectChange={setProject} onIssues={(next) => setIssues(next)} />

        {stepIndex === 0 && (
          <section className="form-grid">
            <label>
              Project Name
              <input value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} />
            </label>
            <label>
              Region
              <input value={project.region} onChange={(e) => setProject({ ...project, region: e.target.value })} />
            </label>
            <label>
              Unit System
              <input
                value={project.unit_system}
                onChange={(e) => setProject({ ...project, unit_system: e.target.value })}
              />
            </label>
            <label>
              Orientation Basis
              <input
                value={project.orientation_basis}
                onChange={(e) => setProject({ ...project, orientation_basis: e.target.value })}
              />
            </label>
          </section>
        )}

        {stepIndex === 1 && (
          <GridEditor
            title="Design Conditions"
            rows={project.design_conditions}
            columns={designColumns}
            createEmptyRow={createEmptyDesignCondition}
            onChange={(rows) => setProject({ ...project, design_conditions: rows })}
          />
        )}

        {stepIndex === 2 && (
          <section className="card">
            <p>
              Region reference values are applied from backend tables using current region:{" "}
              <strong>{project.region}</strong>.
            </p>
          </section>
        )}

        {stepIndex === 3 && (
          <GridEditor
            title="Openings"
            rows={project.openings}
            columns={openingColumns}
            createEmptyRow={createEmptyOpening}
            onChange={(rows) => setProject({ ...project, openings: rows })}
          />
        )}

        {stepIndex === 4 && (
          <GridEditor
            title="Surfaces"
            rows={project.surfaces}
            columns={surfaceColumns}
            createEmptyRow={createEmptySurface}
            onChange={(rows) => setProject({ ...project, surfaces: rows })}
          />
        )}

        {stepIndex === 5 && (
          <GridEditor
            title="Rooms"
            rows={project.rooms}
            columns={roomColumns}
            createEmptyRow={createEmptyRoom}
            onChange={(rows) => setProject({ ...project, rooms: rows })}
          />
        )}

        {stepIndex === 6 && (
          <GridEditor
            title="Systems"
            rows={project.systems}
            columns={systemColumns}
            createEmptyRow={createEmptySystem}
            onChange={(rows) =>
              setProject({
                ...project,
                systems: rows.map((row) => ({
                  ...row,
                  room_ids: (() => {
                    const raw = (row as unknown as { room_ids: unknown }).room_ids;
                    if (typeof raw === "string") {
                      return raw
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean);
                    }
                    return Array.isArray(raw) ? (raw as string[]) : [];
                  })()
                }))
              })
            }
          />
        )}

        {stepIndex === 7 && (
          <section className="card">
            <button type="button" onClick={onRunCalc} disabled={busy}>
              {busy ? "Running..." : "Run Calculation"}
            </button>
            <ResultPanel result={calcResult} />
          </section>
        )}

        {stepIndex === 8 && (
          <section className="card output-panel">
            <button type="button" onClick={onExportJson} disabled={busy}>
              Export JSON
            </button>
            <button type="button" onClick={onExportExcel} disabled={busy}>
              Export Excel
            </button>
            <p>Excel output keeps formula-based workbook behavior.</p>
          </section>
        )}

        {issues.length > 0 && (
          <section className="issue-panel">
            <h3>Validation Messages</h3>
            <ul>
              {issues.map((issue, idx) => (
                <li key={`${issue.level}-${idx}`}>
                  [{issue.level}] {issue.message}
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="step-actions">
          <button type="button" disabled={stepIndex === 0} onClick={() => setStepIndex((s) => s - 1)}>
            Back
          </button>
          <button
            type="button"
            disabled={stepIndex === steps.length - 1}
            onClick={() => setStepIndex((s) => s + 1)}
          >
            Next
          </button>
        </footer>
      </main>
    </div>
  );
}
