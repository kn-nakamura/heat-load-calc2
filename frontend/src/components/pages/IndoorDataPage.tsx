import { useEffect, useMemo, useRef, useState } from "react";
import type { ColDef, ValueParserParams } from "ag-grid-community";
import { Thermometer, Fan } from "lucide-react";
import GridEditor from "../GridEditor";
import LightingLoadEditor from "../LightingLoadEditor";
import OccupancyLoadEditor from "../OccupancyLoadEditor";
import type { Project, DesignCondition, InternalLoad, MechanicalLoad } from "../../types";
import api from "../../api/client";

interface Props {
  project: Project;
  onChange: (project: Project) => void;
}

const numberParser = (params: ValueParserParams): number | undefined => {
  const raw = params.newValue;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : undefined;
  const value = String(raw).trim();
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const createEmptyCondition = (): DesignCondition => ({
  id: "",
  summer_drybulb_c: 0,
  summer_rh_pct: 0,
  summer_wetbulb_c: 0,
  summer_dewpoint_c: 0,
  summer_enthalpy_kj_per_kgda: 0,
  summer_abs_humidity_kg_per_kgda: 0,
  winter_drybulb_c: 0,
  winter_rh_pct: 0,
  winter_wetbulb_c: 0,
  winter_dewpoint_c: 0,
  winter_enthalpy_kj_per_kgda: 0,
  winter_abs_humidity_kg_per_kgda: 0,
});

interface ApiSeasonData {
  drybulb_c: number;
  rh_pct: number;
  wetbulb_c: number;
  dewpoint_c: number;
  enthalpy_kj_per_kgda: number;
  abs_humidity_kg_per_kgda: number;
}

interface ApiRecord {
  condition_name: string;
  summer: ApiSeasonData;
  winter: ApiSeasonData;
}

const mapApiRecordToDesignCondition = (record: ApiRecord): DesignCondition => ({
  id: record.condition_name,
  summer_drybulb_c: record.summer.drybulb_c,
  summer_rh_pct: record.summer.rh_pct,
  summer_wetbulb_c: record.summer.wetbulb_c,
  summer_dewpoint_c: record.summer.dewpoint_c,
  summer_enthalpy_kj_per_kgda: record.summer.enthalpy_kj_per_kgda,
  summer_abs_humidity_kg_per_kgda: record.summer.abs_humidity_kg_per_kgda,
  winter_drybulb_c: record.winter.drybulb_c,
  winter_rh_pct: record.winter.rh_pct,
  winter_wetbulb_c: record.winter.wetbulb_c,
  winter_dewpoint_c: record.winter.dewpoint_c,
  winter_enthalpy_kj_per_kgda: record.winter.enthalpy_kj_per_kgda,
  winter_abs_humidity_kg_per_kgda: record.winter.abs_humidity_kg_per_kgda,
});

const createEmptyInternalLoad = () =>
  ({ id: "", room_id: "", kind: "", sensible_w: "", latent_w: "" } as unknown as InternalLoad);

const createEmptyMechanicalLoad = () =>
  ({ id: "", room_id: "", sensible_w: "", latent_w: "" } as unknown as MechanicalLoad);

const generateLoadId = (kind: "lighting" | "occupancy" | "equipment"): string => {
  const prefixMap = {
    lighting: "qE",
    occupancy: "qH",
    equipment: "qM",
  };
  return prefixMap[kind];
};

const generateMechanicalId = (): string => "qM";

type LoadTab = "lighting" | "occupancy" | "equipment" | "mechanical";

export default function IndoorDataPage({ project, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<LoadTab>("lighting");
  const fetchedRef = useRef(false);

  // Fetch design indoor conditions from API on mount
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Only populate if project has no design conditions yet
    if (project.design_conditions.length > 0) return;

    api
      .get<{ data: { records: ApiRecord[] } }>("/reference/design_indoor_conditions")
      .then((response) => {
        const records = response.data.data.records;
        const conditions = records.map(mapApiRecordToDesignCondition);
        if (conditions.length > 0) {
          onChange({ ...project, design_conditions: conditions });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch design indoor conditions:", err);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const conditionColumns = useMemo<ColDef<DesignCondition>[]>(
    () => [
      { field: "id", headerName: "ID(条件名)", minWidth: 160, pinned: "left" },
      {
        headerName: "夏期",
        children: [
          { field: "summer_drybulb_c", headerName: "乾球温度 [°C]", valueParser: numberParser, minWidth: 120 },
          { field: "summer_rh_pct", headerName: "相対湿度 [%]", valueParser: numberParser, minWidth: 120 },
          { field: "summer_wetbulb_c", headerName: "湿球温度 [°C]", valueParser: numberParser, minWidth: 120 },
          { field: "summer_dewpoint_c", headerName: "露点温度 [°C]", valueParser: numberParser, minWidth: 120 },
          { field: "summer_enthalpy_kj_per_kgda", headerName: "比エンタルピー [kJ/kgDA]", valueParser: numberParser, minWidth: 160 },
          { field: "summer_abs_humidity_kg_per_kgda", headerName: "絶対湿度 [kg/kgDA]", valueParser: numberParser, minWidth: 150 },
        ],
      },
      {
        headerName: "冬期",
        children: [
          { field: "winter_drybulb_c", headerName: "乾球温度 [°C]", valueParser: numberParser, minWidth: 120 },
          { field: "winter_rh_pct", headerName: "相対湿度 [%]", valueParser: numberParser, minWidth: 120 },
          { field: "winter_wetbulb_c", headerName: "湿球温度 [°C]", valueParser: numberParser, minWidth: 120 },
          { field: "winter_dewpoint_c", headerName: "露点温度 [°C]", valueParser: numberParser, minWidth: 120 },
          { field: "winter_enthalpy_kj_per_kgda", headerName: "比エンタルピー [kJ/kgDA]", valueParser: numberParser, minWidth: 160 },
          { field: "winter_abs_humidity_kg_per_kgda", headerName: "絶対湿度 [kg/kgDA]", valueParser: numberParser, minWidth: 150 },
        ],
      },
    ],
    []
  );

  const internalLoadColumns = useMemo<ColDef<InternalLoad>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 100, editable: false },
      { field: "room_id", headerName: "室ID", minWidth: 110 },
      { field: "kind", headerName: "種別", minWidth: 120 },
      { field: "sensible_w", headerName: "顕熱 [W]", valueParser: numberParser, minWidth: 110 },
      { field: "latent_w", headerName: "潜熱 [W]", valueParser: numberParser, minWidth: 110 },
    ],
    []
  );

  const mechanicalLoadColumns = useMemo<ColDef<MechanicalLoad>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 100, editable: false },
      { field: "room_id", headerName: "室ID", minWidth: 110 },
      { field: "sensible_w", headerName: "顕熱 [W]", valueParser: numberParser, minWidth: 110 },
      { field: "latent_w", headerName: "潜熱 [W]", valueParser: numberParser, minWidth: 110 },
    ],
    []
  );

  const loadTabs = [
    { key: "lighting" as const, label: "照明" },
    { key: "occupancy" as const, label: "人体" },
    { key: "equipment" as const, label: "機器" },
    { key: "mechanical" as const, label: "機械負荷" },
  ];

  const filterInternalLoads = (kind: InternalLoad["kind"]) =>
    project.internal_loads.filter((row) => row.kind === kind);

  const updateInternalLoads = (kind: InternalLoad["kind"], rows: InternalLoad[]) => {
    const preserved = project.internal_loads.filter((row) => row.kind !== kind);
    const normalized = rows.map((row) => ({ ...row, kind }));
    onChange({ ...project, internal_loads: [...preserved, ...normalized] });
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Thermometer size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-slate-800">設計用屋内条件</h3>
          <span className="text-xs text-slate-400">Indoor Design Conditions</span>
        </div>
        <div className="px-5 pt-3 pb-1">
          <p className="text-xs text-slate-500">
            各室の夏期・冬期における室内設計温湿度を設定します。下のグリッドで直接編集するか、Excelからコピー＆ペーストできます。
          </p>
        </div>
      </section>

      <GridEditor
        title="屋内設計条件テーブル"
        hint="Indoor Conditions Table - click cells to edit"
        rows={project.design_conditions}
        columns={conditionColumns}
        createEmptyRow={createEmptyCondition}
        onChange={(rows) => onChange({ ...project, design_conditions: rows })}
        height="360px"
      />

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Fan size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-slate-800">内部発熱・機械負荷</h3>
          <span className="text-xs text-slate-400">Internal & Mechanical Loads</span>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500">
            照明・人体・機器・機械負荷の発熱量を室IDごとに入力します。
          </p>
          <div className="flex flex-wrap gap-2">
            {loadTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeTab === "lighting" && (
        <LightingLoadEditor
          project={project}
          rows={filterInternalLoads("lighting")}
          onChange={(rows) => updateInternalLoads("lighting", rows)}
        />
      )}

      {activeTab === "occupancy" && (
        <OccupancyLoadEditor
          project={project}
          rows={filterInternalLoads("occupancy")}
          onChange={(rows) => updateInternalLoads("occupancy", rows)}
        />
      )}

      {activeTab === "equipment" && (
        <GridEditor<InternalLoad>
          title="内部発熱（機器）"
          hint="室IDごとに機器の発熱量を入力します。"
          rows={filterInternalLoads("equipment")}
          columns={internalLoadColumns}
          createEmptyRow={() => {
            const existingLoads = filterInternalLoads("equipment");
            const nextIndex = existingLoads.length + 1;
            return {
              ...createEmptyInternalLoad(),
              kind: "equipment",
              id: `${generateLoadId("equipment")}_${nextIndex}`,
            };
          }}
          onChange={(rows) => updateInternalLoads("equipment", rows)}
          height="360px"
        />
      )}

      {activeTab === "mechanical" && (
        <GridEditor
          title="機械負荷"
          hint="室IDごとに機械負荷の顕熱・潜熱を入力します。"
          rows={project.mechanical_loads}
          columns={mechanicalLoadColumns}
          createEmptyRow={() => {
            const nextIndex = project.mechanical_loads.length + 1;
            return {
              ...createEmptyMechanicalLoad(),
              id: `${generateMechanicalId()}_${nextIndex}`,
            };
          }}
          onChange={(rows) => onChange({ ...project, mechanical_loads: rows })}
          height="360px"
        />
      )}
    </div>
  );
}
