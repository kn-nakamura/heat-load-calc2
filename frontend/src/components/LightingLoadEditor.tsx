import { useMemo, useRef } from "react";
import type { ColDef, GridApi } from "ag-grid-community";
import { themeQuartz } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Plus, Trash2 } from "lucide-react";
import type { InternalLoad, Project } from "../types";

interface Props {
  project: Project;
  rows: InternalLoad[];
  onChange: (rows: InternalLoad[]) => void;
}

// Standard values from Table 2-7 for lighting W/m²
const STANDARD_POWER_DENSITY = [
  { label: "3 W/m² (省エネ)", value: 3 },
  { label: "4 W/m²", value: 4 },
  { label: "5 W/m²", value: 5 },
  { label: "6 W/m²", value: 6 },
  { label: "7 W/m²", value: 7 },
  { label: "8 W/m²", value: 8 },
];

// Standard illuminance values (lux)
const STANDARD_ILLUMINANCE = [
  { label: "200 lux", value: 200 },
  { label: "300 lux", value: 300 },
  { label: "500 lux", value: 500 },
  { label: "750 lux", value: 750 },
  { label: "1000 lux", value: 1000 },
];

const calculateSensibleHeat = (
  powerDensity: number | undefined,
  roomArea: number | undefined
): number => {
  if (!powerDensity || !roomArea) return 0;
  return Math.round(roomArea * powerDensity);
};

export default function LightingLoadEditor({ project, rows, onChange }: Props) {
  const apiRef = useRef<GridApi<InternalLoad> | null>(null);

  // Get room area map for reference
  const roomAreaMap = useMemo(() => {
    const map: Record<string, number> = {};
    project.rooms.forEach((room) => {
      map[room.id] = room.area_m2;
    });
    return map;
  }, [project.rooms]);

  const columns = useMemo<ColDef<InternalLoad>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 100, editable: false },
      { field: "room_id", headerName: "室ID", minWidth: 110 },
      {
        field: "illuminance_lux",
        headerName: "照度 [lux]",
        minWidth: 120,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: STANDARD_ILLUMINANCE.map((item) => item.value),
          valueListMaxHeight: 200,
        },
        valueParser: (params) => {
          const value = params.newValue;
          if (value === undefined || value === null) return undefined;
          const num = Number(value);
          return Number.isFinite(num) ? num : undefined;
        },
        valueFormatter: (params) => {
          const value = params.value as number | undefined;
          if (!value) return "";
          return `${value}`;
        },
      },
      {
        field: "power_density_w_m2",
        headerName: "電力密度 [W/m²]",
        minWidth: 140,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: STANDARD_POWER_DENSITY.map((item) => item.value),
          valueListMaxHeight: 200,
        },
        valueParser: (params) => {
          const value = params.newValue;
          if (value === undefined || value === null) return undefined;
          const num = Number(value);
          return Number.isFinite(num) ? num : undefined;
        },
        valueFormatter: (params) => {
          const value = params.value as number | undefined;
          if (!value) return "";
          return `${value}`;
        },
      },
      {
        field: "sensible_w",
        headerName: "顕熱 [W]（計算値）",
        minWidth: 140,
        editable: false,
        valueFormatter: (params) => {
          const node = params.node;
          if (!node || !node.data) return "";
          const roomId = (node.data as InternalLoad).room_id;
          const roomArea = roomAreaMap[roomId];
          const powerDensity = (node.data as InternalLoad).power_density_w_m2;
          const sensible = calculateSensibleHeat(powerDensity, roomArea);
          return sensible > 0 ? `${sensible}` : "";
        },
      },
      {
        field: "latent_w",
        headerName: "潜熱 [W]",
        minWidth: 110,
        valueParser: (params) => {
          const value = params.newValue;
          if (value === undefined || value === null) return undefined;
          const num = Number(value);
          return Number.isFinite(num) ? num : undefined;
        },
      },
    ],
    [roomAreaMap]
  );

  const handleAddRow = () => {
    onChange([
      ...rows,
      {
        id: `qE_${rows.length + 1}`,
        room_id: "",
        kind: "lighting",
        sensible_w: 0,
        latent_w: 0,
        illuminance_lux: 500,
        power_density_w_m2: 5,
      },
    ]);
  };

  const handleDeleteSelectedRows = () => {
    const api = apiRef.current;
    if (!api) return;
    const selectedRows = new Set(api.getSelectedRows());
    const nextRows = rows.filter((row) => !selectedRows.has(row));
    onChange(nextRows);
  };

  const handleCellValueChanged = () => {
    const api = apiRef.current;
    if (!api) return;
    const nextRows: InternalLoad[] = [];
    api.forEachNode((node) => {
      if (!node.data) return;
      const data = node.data as InternalLoad;
      // Auto-calculate sensible_w based on power_density and room area
      if (data.power_density_w_m2 && data.room_id) {
        const roomArea = roomAreaMap[data.room_id];
        if (roomArea) {
          data.sensible_w = calculateSensibleHeat(
            data.power_density_w_m2,
            roomArea
          );
        }
      }
      nextRows.push(data);
    });
    onChange(nextRows);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            内部発熱（照明）
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            照度と電力密度から顕熱を自動計算します。
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
          >
            <Plus size={14} /> 行追加
          </button>
          <button
            type="button"
            onClick={handleDeleteSelectedRows}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            <Trash2 size={14} /> 選択削除
          </button>
        </div>
      </div>
      <p className="px-5 py-2 text-xs text-slate-400 bg-slate-50/30 border-b border-slate-100">
        セルをクリックして直接編集。照度と電力密度を設定すると、顕熱が自動計算されます。
      </p>
      <div style={{ height: "360px", width: "100%" }}>
        <AgGridReact<InternalLoad>
          theme={themeQuartz}
          rowData={rows}
          columnDefs={[
            {
              headerName: "",
              width: 52,
              minWidth: 52,
              maxWidth: 52,
              pinned: "left",
              checkboxSelection: true,
              headerCheckboxSelection: true,
              editable: false,
              sortable: false,
              filter: false,
              resizable: false,
            },
            {
              headerName: "#",
              width: 40,
              minWidth: 40,
              maxWidth: 40,
              pinned: "left",
              editable: false,
              sortable: false,
              filter: false,
              resizable: false,
              valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
              cellClass: "text-right text-slate-400 text-xs",
            },
            ...columns,
          ]}
          rowSelection="multiple"
          singleClickEdit
          stopEditingWhenCellsLoseFocus
          defaultColDef={{
            editable: true,
            resizable: true,
            sortable: true,
            filter: true,
            flex: 1,
            minWidth: 100,
          }}
          onGridReady={(event) => {
            apiRef.current = event.api;
          }}
          onCellValueChanged={handleCellValueChanged}
        />
      </div>
    </div>
  );
}
