import { useEffect, useMemo, useState } from "react";
import type { ColDef, ValueParserParams } from "ag-grid-community";
import { DoorOpen, SquareStack, PanelTop, Fan, Wrench } from "lucide-react";
import GridEditor from "../GridEditor";
import RoomInternalLoadsPanel from "../RoomInternalLoadsPanel";
import type {
  Project,
  Room,
  Surface,
  Opening,
  InternalLoad,
  MechanicalLoad,
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
  ({ id: "", name: "", usage: "", floor: "", area_m2: 0, ceiling_height_m: 0, system_id: "" } as unknown as Room);
const createEmptySurface = () =>
  ({
    id: "",
    room_id: "",
    kind: "",
    orientation: "",
    area_m2: 0,
    adjacent_type: "outdoor",
    adjacent_r_factor: 1,
    construction_id: "",
  } as unknown as Surface);
const createEmptyOpening = () =>
  ({ id: "", room_id: "", surface_id: "", orientation: "", area_m2: 0, glass_id: "", shading_sc: 0 } as unknown as Opening);
const createEmptyInternalLoad = () =>
  ({ id: "", room_id: "", kind: "", sensible_w: 0, latent_w: 0 } as unknown as InternalLoad);
const createEmptyMechanicalLoad = () =>
  ({ id: "", room_id: "", sensible_w: 0, latent_w: 0 } as unknown as MechanicalLoad);
const createEmptyVentilation = () =>
  ({ id: "", room_id: "", outdoor_air_m3h: 0, infiltration_mode: "", sash_type: "", airtightness: "", wind_speed_ms: 0 } as unknown as Ventilation);

type Tab = "rooms" | "surfaces" | "openings" | "internal_loads" | "mechanical_loads" | "ventilation";

export default function RoomRegistrationPage({ project, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("surfaces");
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();

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
      {
        field: "adjacent_type",
        headerName: "隣接種別",
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["outdoor", "external", "ground", "internal", "unconditioned"] },
        minWidth: 120,
      },
      { field: "adjacent_temp_c", headerName: "隣室温度 [°C]", valueParser: numberParser, minWidth: 130 },
      { field: "adjacent_r_factor", headerName: "非空調係数 r", valueParser: numberParser, minWidth: 130 },
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

  const mechanicalLoadColumns = useMemo<ColDef<MechanicalLoad>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 100 },
      { field: "room_id", headerName: "室ID", minWidth: 100 },
      { field: "sensible_w", headerName: "顕熱 [W]", valueParser: numberParser, minWidth: 110 },
      { field: "latent_w", headerName: "潜熱 [W]", valueParser: numberParser, minWidth: 110 },
    ],
    []
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    {
      key: "surfaces",
      label: "面（壁・屋根・床）",
      icon: <SquareStack size={15} />,
      count: selectedRoomId ? project.surfaces.filter((row) => row.room_id === selectedRoomId).length : 0,
    },
    {
      key: "openings",
      label: "開口部（窓）",
      icon: <PanelTop size={15} />,
      count: selectedRoomId ? project.openings.filter((row) => row.room_id === selectedRoomId).length : 0,
    },
    {
      key: "internal_loads",
      label: "内部発熱",
      icon: <Fan size={15} />,
      count: selectedRoomId ? project.internal_loads.filter((row) => row.room_id === selectedRoomId).length : 0,
    },
    {
      key: "mechanical_loads",
      label: "機械負荷",
      icon: <Wrench size={15} />,
      count: selectedRoomId ? project.mechanical_loads.filter((row) => row.room_id === selectedRoomId).length : 0,
    },
    {
      key: "ventilation",
      label: "換気・隙間風",
      icon: <Fan size={15} />,
      count: selectedRoomId ? project.ventilation_infiltration.filter((row) => row.room_id === selectedRoomId).length : 0,
    },
  ];

  const selectedRoom = useMemo(
    () => project.rooms.find((room) => room.id === selectedRoomId),
    [project.rooms, selectedRoomId]
  );

  useEffect(() => {
    if (selectedRoomId && !selectedRoom) {
      setSelectedRoomId(undefined);
    }
  }, [selectedRoomId, selectedRoom]);

  const filterByRoom = <T extends { room_id?: string }>(rows: T[]) =>
    selectedRoomId ? rows.filter((row) => row.room_id === selectedRoomId) : [];

  const updateRowsForRoom = <T extends { room_id?: string }>(rows: T[], updatedRows: T[]) => {
    if (!selectedRoomId) return rows;
    const preserved = rows.filter((row) => row.room_id !== selectedRoomId);
    const withRoom = updatedRows.map((row) => ({ ...row, room_id: selectedRoomId }));
    return [...preserved, ...withRoom];
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,1fr)_minmax(520px,2fr)] gap-5">
        <GridEditor
          title="室登録 (Rooms)"
          hint="室リストから対象の室を選択すると、右側で壁・窓・内部負荷などを入力できます。"
          rows={project.rooms}
          columns={roomColumns}
          createEmptyRow={createEmptyRoom}
          rowSelection="single"
          onSelectionChange={(rows) => {
            const first = rows[0] as Room | undefined;
            setSelectedRoomId(first?.id ? String(first.id) : undefined);
          }}
          onChange={(rows) => onChange({ ...project, rooms: rows })}
        />
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-800">室別入力パネル</h3>
            {selectedRoom ? (
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div>
                  <span className="block text-[11px] text-slate-400">室ID</span>
                  <span className="font-medium text-slate-700">{selectedRoom.id}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">室名</span>
                  <span className="font-medium text-slate-700">{selectedRoom.name || "未設定"}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">用途</span>
                  <span className="font-medium text-slate-700">{selectedRoom.usage || "未設定"}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">階</span>
                  <span className="font-medium text-slate-700">{selectedRoom.floor || "未設定"}</span>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">左の室リストから室を選択してください。</p>
            )}
          </div>

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
                disabled={!selectedRoom}
              >
                {tab.icon}
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {selectedRoom ? tab.count : 0}
                </span>
              </button>
            ))}
          </div>

          {!selectedRoom && (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
              室を選択すると、壁・開口部・内部負荷・換気条件をこのパネルで入力できます。
            </div>
          )}

          {selectedRoom && activeTab === "surfaces" && (
            <GridEditor
              title={`面データ (Surfaces) - ${selectedRoom.name || selectedRoom.id}`}
              hint="壁・屋根・床の面ID、種別、方位、面積、構造体IDを入力"
              rows={filterByRoom(project.surfaces)}
              columns={surfaceColumns.filter((col) => col.field !== "room_id")}
              createEmptyRow={() => ({ ...createEmptySurface(), room_id: selectedRoom.id })}
              onChange={(rows) => onChange({ ...project, surfaces: updateRowsForRoom(project.surfaces, rows) })}
            />
          )}

          {selectedRoom && activeTab === "openings" && (
            <GridEditor
              title={`開口部データ (Openings) - ${selectedRoom.name || selectedRoom.id}`}
              hint="窓のID、面ID、方位、面積、ガラスID、遮蔽係数を入力"
              rows={filterByRoom(project.openings)}
              columns={openingColumns.filter((col) => col.field !== "room_id")}
              createEmptyRow={() => ({ ...createEmptyOpening(), room_id: selectedRoom.id })}
              onChange={(rows) => onChange({ ...project, openings: updateRowsForRoom(project.openings, rows) })}
            />
          )}

          {selectedRoom && activeTab === "internal_loads" && (
            <RoomInternalLoadsPanel
              project={project}
              roomId={selectedRoom.id}
              roomName={selectedRoom.name}
              rows={filterByRoom(project.internal_loads)}
              onChange={(rows) => onChange({ ...project, internal_loads: updateRowsForRoom(project.internal_loads, rows) })}
            />
          )}

          {selectedRoom && activeTab === "mechanical_loads" && (
            <GridEditor
              title={`機械負荷 (Mechanical Loads) - ${selectedRoom.name || selectedRoom.id}`}
              hint="室内機械負荷の顕熱・潜熱を入力"
              rows={filterByRoom(project.mechanical_loads)}
              columns={mechanicalLoadColumns.filter((col) => col.field !== "room_id")}
              createEmptyRow={() => ({ ...createEmptyMechanicalLoad(), room_id: selectedRoom.id })}
              onChange={(rows) => onChange({ ...project, mechanical_loads: updateRowsForRoom(project.mechanical_loads, rows) })}
            />
          )}

          {selectedRoom && activeTab === "ventilation" && (
            <GridEditor
              title={`換気・隙間風 (Ventilation & Infiltration) - ${selectedRoom.name || selectedRoom.id}`}
              hint="外気取入量、サッシ種別、気密性能を入力"
              rows={filterByRoom(project.ventilation_infiltration)}
              columns={ventilationColumns.filter((col) => col.field !== "room_id")}
              createEmptyRow={() => ({ ...createEmptyVentilation(), room_id: selectedRoom.id })}
              onChange={(rows) => onChange({ ...project, ventilation_infiltration: updateRowsForRoom(project.ventilation_infiltration, rows) })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
