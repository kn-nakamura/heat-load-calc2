import { useMemo, useState } from "react";
import { ColDef } from "ag-grid-community";
import StepNav from "./components/StepNav";
import GridEditor from "./components/GridEditor";
import ResultPanel from "./components/ResultPanel";
import BulkImportPanel from "./components/BulkImportPanel";
import { exportExcel, exportJson, runCalculation, validateProject } from "./api/client";
import type { CalcResult, DesignCondition, Opening, Project, Room, Surface, SystemEntity } from "./types";

const steps = [
  "プロジェクト基本条件",
  "設計条件",
  "屋外条件",
  "窓・ガラス設定",
  "構造体設定",
  "室登録",
  "系統登録",
  "負荷確認",
  "出力"
];

const defaultProject: Project = {
  id: "project-1",
  name: "新規熱負荷プロジェクト",
  unit_system: "SI",
  region: "東京",
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
      { field: "name", headerName: "室名" },
      { field: "usage", headerName: "用途" },
      { field: "floor", headerName: "階" },
      { field: "area_m2", headerName: "面積[m2]" },
      { field: "ceiling_height_m", headerName: "天井高[m]" },
      { field: "system_id", headerName: "系統ID" }
    ],
    []
  );

  const surfaceColumns = useMemo<ColDef<Surface>[]>(
    () => [
      { field: "id", headerName: "ID" },
      { field: "room_id", headerName: "室ID" },
      { field: "kind", headerName: "種別" },
      { field: "orientation", headerName: "方位" },
      { field: "area_m2", headerName: "面積[m2]" },
      { field: "construction_id", headerName: "構造体ID" }
    ],
    []
  );

  const openingColumns = useMemo<ColDef<Opening>[]>(
    () => [
      { field: "id", headerName: "ID" },
      { field: "room_id", headerName: "室ID" },
      { field: "surface_id", headerName: "面ID" },
      { field: "orientation", headerName: "方位" },
      { field: "area_m2", headerName: "面積[m2]" },
      { field: "glass_id", headerName: "ガラスID" },
      { field: "shading_sc", headerName: "SC" }
    ],
    []
  );

  const systemColumns = useMemo<ColDef<SystemEntity>[]>(
    () => [
      { field: "id", headerName: "系統ID" },
      { field: "name", headerName: "名称" },
      { field: "room_ids", headerName: "室ID配列(JSON)" }
    ],
    []
  );

  const designColumns = useMemo<ColDef<DesignCondition>[]>(
    () => [
      { field: "id", headerName: "ID" },
      { field: "season", headerName: "季節" },
      { field: "indoor_temp_c", headerName: "室温[℃]" },
      { field: "indoor_rh_pct", headerName: "室内RH[%]" }
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
          <p>手入力・グリッド編集・一括取込を前提にしたMVP画面</p>
        </header>

        <BulkImportPanel
          project={project}
          onProjectChange={setProject}
          onIssues={(next) => setIssues(next)}
        />

        {stepIndex === 0 && (
          <section className="form-grid">
            <label>
              プロジェクト名
              <input
                value={project.name}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
              />
            </label>
            <label>
              地域
              <input
                value={project.region}
                onChange={(e) => setProject({ ...project, region: e.target.value })}
              />
            </label>
            <label>
              単位系
              <input
                value={project.unit_system}
                onChange={(e) => setProject({ ...project, unit_system: e.target.value })}
              />
            </label>
            <label>
              方位基準
              <input
                value={project.orientation_basis}
                onChange={(e) => setProject({ ...project, orientation_basis: e.target.value })}
              />
            </label>
          </section>
        )}

        {stepIndex === 1 && (
          <GridEditor
            title="設計条件"
            rows={project.design_conditions}
            columns={designColumns}
            onChange={(rows) => setProject({ ...project, design_conditions: rows })}
          />
        )}

        {stepIndex === 2 && (
          <section className="card">
            <p>屋外条件は地域選択（{project.region}）に基づきバックエンド参照表から取得します。</p>
          </section>
        )}

        {stepIndex === 3 && (
          <GridEditor
            title="窓・ガラス設定"
            rows={project.openings}
            columns={openingColumns}
            onChange={(rows) => setProject({ ...project, openings: rows })}
          />
        )}

        {stepIndex === 4 && (
          <GridEditor
            title="構造体/面設定"
            rows={project.surfaces}
            columns={surfaceColumns}
            onChange={(rows) => setProject({ ...project, surfaces: rows })}
          />
        )}

        {stepIndex === 5 && (
          <GridEditor
            title="室登録"
            rows={project.rooms}
            columns={roomColumns}
            onChange={(rows) => setProject({ ...project, rooms: rows })}
          />
        )}

        {stepIndex === 6 && (
          <GridEditor
            title="系統登録"
            rows={project.systems}
            columns={systemColumns}
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
              {busy ? "計算中..." : "計算実行"}
            </button>
            <ResultPanel result={calcResult} />
          </section>
        )}

        {stepIndex === 8 && (
          <section className="card output-panel">
            <button type="button" onClick={onExportJson} disabled={busy}>
              JSON出力
            </button>
            <button type="button" onClick={onExportExcel} disabled={busy}>
              Excel出力
            </button>
            <p>テンプレート差し込み方式で数式/書式を保持します。</p>
          </section>
        )}

        {issues.length > 0 && (
          <section className="issue-panel">
            <h3>検証メッセージ</h3>
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
            戻る
          </button>
          <button
            type="button"
            disabled={stepIndex === steps.length - 1}
            onClick={() => setStepIndex((s) => s + 1)}
          >
            次へ
          </button>
        </footer>
      </main>
    </div>
  );
}
