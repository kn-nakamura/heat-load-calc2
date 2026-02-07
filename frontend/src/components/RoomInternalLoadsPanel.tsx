import { useMemo, useRef } from "react";
import type { ColDef, GridApi } from "ag-grid-community";
import { themeQuartz } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Plus, Trash2, Copy } from "lucide-react";
import type { InternalLoad, Project } from "../types";

interface Props {
  project: Project;
  roomId: string;
  roomName: string;
  rows: InternalLoad[];
  onChange: (rows: InternalLoad[]) => void;
}

export default function RoomInternalLoadsPanel({
  project,
  roomId,
  roomName,
  rows,
  onChange,
}: Props) {
  const apiRef = useRef<GridApi<InternalLoad> | null>(null);

  // Get available pre-defined loads from project.internal_loads
  const availableLoadIds = useMemo(
    () => project.internal_loads.map((load) => load.id),
    [project.internal_loads]
  );

  // Create map of load ID to full load data for quick lookup
  const loadTemplateMap = useMemo(() => {
    const map: Record<string, InternalLoad> = {};
    project.internal_loads.forEach((load) => {
      map[load.id] = load;
    });
    return map;
  }, [project.internal_loads]);

  const columns = useMemo<ColDef<InternalLoad>[]>(
    () => [
      {
        field: "id",
        headerName: "ID（プリセット選択可）",
        minWidth: 140,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: availableLoadIds,
          valueListMaxHeight: 250,
        },
      },
      {
        field: "kind",
        headerName: "種別",
        minWidth: 100,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["lighting", "occupancy", "equipment", "other"] },
      },
      {
        field: "sensible_w",
        headerName: "顕熱 [W]",
        minWidth: 110,
        valueParser: (params) => {
          const value = params.newValue;
          if (value === undefined || value === null) return undefined;
          const num = Number(value);
          return Number.isFinite(num) ? num : undefined;
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
    [availableLoadIds]
  );

  const handleAddRow = () => {
    onChange([
      ...rows,
      {
        id: "",
        room_id: roomId,
        kind: "other" as const,
        sensible_w: 0,
        latent_w: 0,
      },
    ]);
  };

  const handleAddFromTemplate = (templateId: string) => {
    const template = loadTemplateMap[templateId];
    if (!template) return;

    // Create a copy with new ID if same template is used multiple times
    const newLoad: InternalLoad = {
      ...template,
      room_id: roomId,
      // Keep the same ID - user can edit if needed
      id: template.id,
    };

    onChange([...rows, newLoad]);
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
      // If ID is a pre-defined load, optionally sync its values
      // Comment out to allow manual overrides
      // if (data.id && loadTemplateMap[data.id]) {
      //   const template = loadTemplateMap[data.id];
      //   data.kind = template.kind;
      //   data.sensible_w = template.sensible_w;
      //   data.latent_w = template.latent_w;
      // }
      nextRows.push(data);
    });
    onChange(nextRows);
  };

  return (
    <div className="space-y-3">
      {/* Quick load template buttons */}
      {availableLoadIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-medium text-blue-900 mb-3">
            屋内データで定義したプリセットを使用できます:
          </p>
          <div className="flex flex-wrap gap-2">
            {availableLoadIds.map((loadId) => {
              const template = loadTemplateMap[loadId];
              if (!template) return null;
              const kindLabel = {
                lighting: "照明",
                occupancy: "人体",
                equipment: "機器",
                other: "その他",
                internal_envelope: "内部-外皮",
                internal_solar: "内部-日射",
              }[template.kind] || template.kind;
              return (
                <button
                  key={loadId}
                  type="button"
                  onClick={() => handleAddFromTemplate(loadId)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-300 hover:bg-blue-50 rounded-lg"
                >
                  <Copy size={13} />
                  {loadId} ({kindLabel})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid Editor */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              内部発熱 (Internal Loads)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {roomName || roomId} - IDドロップダウンでプリセット選択可
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
            >
              <Plus size={14} /> 手動追加
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
          IDドロップダウンを使用してプリセットを選択するか、手動で値を入力してください。
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
    </div>
  );
}
