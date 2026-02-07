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

// Standard values from Table 2-7 for occupancy (per person)
const STANDARD_SENSIBLE_HEAT = [
  { label: "60 W/人（軽作業）", value: 60 },
  { label: "80 W/人", value: 80 },
  { label: "100 W/人（標準）", value: 100 },
  { label: "120 W/人", value: 120 },
  { label: "140 W/人（重作業）", value: 140 },
];

const STANDARD_LATENT_HEAT = [
  { label: "20 W/人（低湿度）", value: 20 },
  { label: "40 W/人", value: 40 },
  { label: "50 W/人（標準）", value: 50 },
  { label: "60 W/人", value: 60 },
  { label: "80 W/人（高湿度）", value: 80 },
];

const calculateHeat = (count: number | undefined, perPerson: number | undefined): number => {
  if (!count || !perPerson) return 0;
  return Math.round(count * perPerson);
};

export default function OccupancyLoadEditor({ project, rows, onChange }: Props) {
  const apiRef = useRef<GridApi<InternalLoad> | null>(null);

  const columns = useMemo<ColDef<InternalLoad>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 100, editable: false },
      { field: "room_id", headerName: "室ID", minWidth: 110 },
      {
        field: "occupancy_count",
        headerName: "人数 [人]",
        minWidth: 110,
        valueParser: (params) => {
          const value = params.newValue;
          if (value === undefined || value === null) return undefined;
          const num = Number(value);
          return Number.isFinite(num) && num >= 0 ? num : undefined;
        },
      },
      {
        field: "sensible_per_person_w",
        headerName: "顕熱/人 [W]",
        minWidth: 130,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: STANDARD_SENSIBLE_HEAT.map((item) => item.value),
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
        minWidth: 130,
        editable: false,
        valueFormatter: (params) => {
          const node = params.node;
          if (!node || !node.data) return "";
          const data = node.data as InternalLoad;
          const sensible = calculateHeat(data.occupancy_count, data.sensible_per_person_w);
          return sensible > 0 ? `${sensible}` : "";
        },
      },
      {
        field: "latent_per_person_w",
        headerName: "潜熱/人 [W]",
        minWidth: 130,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: STANDARD_LATENT_HEAT.map((item) => item.value),
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
        field: "latent_w",
        headerName: "潜熱 [W]（計算値）",
        minWidth: 130,
        editable: false,
        valueFormatter: (params) => {
          const node = params.node;
          if (!node || !node.data) return "";
          const data = node.data as InternalLoad;
          const latent = calculateHeat(data.occupancy_count, data.latent_per_person_w);
          return latent > 0 ? `${latent}` : "";
        },
      },
    ],
    []
  );

  const handleAddRow = () => {
    onChange([
      ...rows,
      {
        id: `qH_${rows.length + 1}`,
        room_id: "",
        kind: "occupancy",
        sensible_w: 0,
        latent_w: 0,
        occupancy_count: 1,
        sensible_per_person_w: 100,
        latent_per_person_w: 50,
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
      // Auto-calculate sensible_w and latent_w based on occupancy count
      if (data.occupancy_count) {
        data.sensible_w = calculateHeat(data.occupancy_count, data.sensible_per_person_w);
        data.latent_w = calculateHeat(data.occupancy_count, data.latent_per_person_w);
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
            内部発熱（人体）
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            人数と1人あたりの発熱量から顕熱・潜熱を自動計算します。
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
        セルをクリックして直接編集。人数と1人あたりの発熱量を設定すると、顕熱・潜熱が自動計算されます。
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
