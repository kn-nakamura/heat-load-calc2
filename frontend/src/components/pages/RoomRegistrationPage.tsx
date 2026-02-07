import { useMemo, useState } from "react";
import type { ColDef, ValueParserParams } from "ag-grid-community";
import { DoorOpen, SquareStack, PanelTop, Fan } from "lucide-react";
import GridEditor from "../GridEditor";
import type {
  Project,
  Room,
  Surface,
  Opening,
  InternalLoad,
  Ventilation,
} from "../../types";

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

const createEmptyRoom = () =>
  ({ id: "", name: "", usage: "", floor: "", area_m2: "", ceiling_height_m: "", system_id: "" } as unknown as Room);
const createEmptySurface = () =>
  ({ id: "", room_id: "", kind: "", orientation: "", area_m2: "", construction_id: "" } as unknown as Surface);
const createEmptyOpening = () =>
  ({ id: "", room_id: "", surface_id: "", orientation: "", area_m2: "", glass_id: "", shading_sc: "" } as unknown as Opening);
const createEmptyInternalLoad = () =>
  ({ id: "", room_id: "", kind: "", sensible_w: "", latent_w: "" } as unknown as InternalLoad);
const createEmptyVentilation = () =>
  ({ id: "", room_id: "", outdoor_air_m3h: "", infiltration_mode: "", sash_type: "", airtightness: "", wind_speed_ms: "" } as unknown as Ventilation);

type Tab = "rooms" | "surfaces" | "openings" | "internal_loads" | "ventilation";

export default function RoomRegistrationPage({ project, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("rooms");

  const roomColumns = useMemo<ColDef<Room>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 100 },
      { field: "name", headerName: "室名", minWidth: 160 },
      { field: "usage", headerName: "用途", minWidth: 120 },
      { field: "floor", headerName: "階", minWidth: 80 },
      { field: "area_m2", headerName: "床面積 [m²]", valueParser: numberParser, minWidth: 120 },
      { field: "ceiling_height_m", headerName: "天井高 [m]", valueParser: numberParser, minWidth: 110 },
      { field: "system_id", headerName: "系統ID", minWidth: 100 },
    ],
    []
  );

  const surfaceColumns = useMemo<ColDef<Surface>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 100 },
      { field: "room_id", headerName: "室ID", minWidth: 100 },
      {
        field: "kind",
        headerName: "種別",
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["wall", "roof", "floor", "internal"] },
        minWidth: 110,
      },
      { field: "orientation", headerName: "方位", minWidth: 90 },
      { field: "width_m", headerName: "幅 [m]", valueParser: numberParser, minWidth: 90 },
      { field: "height_m", headerName: "高さ [m]", valueParser: numberParser, minWidth: 90 },
      { field: "area_m2", headerName: "面積 [m²]", valueParser: numberParser, minWidth: 100 },
      { field: "construction_id", headerName: "構造体ID", minWidth: 120 },
    ],
    []
  );

  const openingColumns = useMemo<ColDef<Opening>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 100 },
      { field: "room_id", headerName: "室ID", minWidth: 100 },
      { field: "surface_id", headerName: "面ID", minWidth: 100 },
      { field: "orientation", headerName: "方位", minWidth: 90 },
      { field: "area_m2", headerName: "面積 [m²]", valueParser: numberParser, minWidth: 100 },
      { field: "glass_id", headerName: "ガラスID", minWidth: 110 },
      { field: "shading_sc", headerName: "SC遮蔽係数", valueParser: numberParser, minWidth: 110 },
    ],
    []
  );

  const internalLoadColumns = useMemo<ColDef<InternalLoad>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 100 },
      { field: "room_id", headerName: "室ID", minWidth: 100 },
      {
        field: "kind",
        headerName: "種別",
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["lighting", "occupancy", "equipment", "other"] },
        minWidth: 120,
      },
      { field: "sensible_w", headerName: "顕熱 [W]", valueParser: numberParser, minWidth: 110 },
      { field: "latent_w", headerName: "潜熱 [W]", valueParser: numberParser, minWidth: 110 },
    ],
    []
  );

  const ventilationColumns = useMemo<ColDef<Ventilation>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 100 },
      { field: "room_id", headerName: "室ID", minWidth: 100 },
      { field: "outdoor_air_m3h", headerName: "外気量 [m³/h]", valueParser: numberParser, minWidth: 130 },
      { field: "infiltration_mode", headerName: "侵入モード", minWidth: 120 },
      { field: "sash_type", headerName: "サッシ種別", minWidth: 110 },
      { field: "airtightness", headerName: "気密等級", minWidth: 100 },
      { field: "wind_speed_ms", headerName: "風速 [m/s]", valueParser: numberParser, minWidth: 100 },
    ],
    []
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "rooms", label: "室", icon: <DoorOpen size={15} />, count: project.rooms.length },
    { key: "surfaces", label: "面（壁・屋根・床）", icon: <SquareStack size={15} />, count: project.surfaces.length },
    { key: "openings", label: "開口部（窓）", icon: <PanelTop size={15} />, count: project.openings.length },
    { key: "internal_loads", label: "内部発熱", icon: <Fan size={15} />, count: project.internal_loads.length },
    { key: "ventilation", label: "換気・隙間風", icon: <Fan size={15} />, count: project.ventilation_infiltration.length },
  ];

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${activeTab === tab.key
                ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }
            `}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grids */}
      {activeTab === "rooms" && (
        <GridEditor
          title="室登録 (Rooms)"
          hint="各室のID、名称、用途、階、床面積、天井高、系統IDを入力"
          rows={project.rooms}
          columns={roomColumns}
          createEmptyRow={createEmptyRoom}
          onChange={(rows) => onChange({ ...project, rooms: rows })}
        />
      )}

      {activeTab === "surfaces" && (
        <GridEditor
          title="面データ (Surfaces)"
          hint="壁・屋根・床の面ID、室ID、種別、方位、面積、構造体IDを入力"
          rows={project.surfaces}
          columns={surfaceColumns}
          createEmptyRow={createEmptySurface}
          onChange={(rows) => onChange({ ...project, surfaces: rows })}
        />
      )}

      {activeTab === "openings" && (
        <GridEditor
          title="開口部データ (Openings)"
          hint="窓のID、室ID、面ID、方位、面積、ガラスID、遮蔽係数を入力"
          rows={project.openings}
          columns={openingColumns}
          createEmptyRow={createEmptyOpening}
          onChange={(rows) => onChange({ ...project, openings: rows })}
        />
      )}

      {activeTab === "internal_loads" && (
        <GridEditor
          title="内部発熱 (Internal Loads)"
          hint="照明・人体・機器の発熱量を入力"
          rows={project.internal_loads}
          columns={internalLoadColumns}
          createEmptyRow={createEmptyInternalLoad}
          onChange={(rows) => onChange({ ...project, internal_loads: rows })}
        />
      )}

      {activeTab === "ventilation" && (
        <GridEditor
          title="換気・隙間風 (Ventilation & Infiltration)"
          hint="外気取入量、サッシ種別、気密性能を入力"
          rows={project.ventilation_infiltration}
          columns={ventilationColumns}
          createEmptyRow={createEmptyVentilation}
          onChange={(rows) => onChange({ ...project, ventilation_infiltration: rows })}
        />
      )}
    </div>
  );
}
