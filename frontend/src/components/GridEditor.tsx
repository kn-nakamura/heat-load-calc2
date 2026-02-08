import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  SelectionChangedEvent
} from "ag-grid-community";
import { themeQuartz } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Plus, Trash2 } from "lucide-react";

interface GridEditorProps<T extends object> {
  title: string;
  hint?: string;
  rows: T[];
  columns: ColDef<T>[];
  createEmptyRow: () => T;
  onChange: (rows: T[]) => void;
  height?: string;
  rowSelection?: "single" | "multiple";
  onSelectionChange?: (rows: T[]) => void;
}

export default function GridEditor<T extends object>({
  title,
  hint,
  rows,
  columns,
  createEmptyRow,
  onChange,
  height = "480px",
  rowSelection = "multiple",
  onSelectionChange
}: GridEditorProps<T>) {
  const apiRef = useRef<GridApi<T> | null>(null);

  const tableColumns = useMemo<ColDef<T>[]>(() => {
    const checkboxCol: ColDef<T> = {
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
      cellClass: "text-center"
    };
    const rowNoCol: ColDef<T> = {
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
      cellClass: "text-right text-slate-400 text-xs"
    };
    return [checkboxCol, rowNoCol, ...columns];
  }, [columns]);

  const syncRowsFromGrid = useCallback((api: GridApi<T>) => {
    const nextRows: T[] = [];
    api.forEachNode((node) => {
      if (!node.data) return;
      const id = (node.data as Record<string, unknown>).id;
      if (id && typeof id === 'string' && id.trim().length > 0) {
        nextRows.push(node.data as T);
      }
    });
    onChange(nextRows);
  }, [onChange]);

  const handleGridReady = (event: GridReadyEvent<T>) => {
    apiRef.current = event.api;
  };

  const pendingScrollRef = useRef<number | null>(null);

  const handleAddRow = () => {
    const newRowIndex = rows.length;
    onChange([...rows, createEmptyRow()]);
    pendingScrollRef.current = newRowIndex;
  };

  useEffect(() => {
    if (pendingScrollRef.current === null) return;
    const rowIndex = pendingScrollRef.current;
    pendingScrollRef.current = null;
    const api = apiRef.current;
    if (!api) return;
    // Wait for grid to process the new rowData
    requestAnimationFrame(() => {
      api.ensureIndexVisible(rowIndex, "bottom");
      const firstEditable = columns.find((col) => col.field)?.field;
      if (firstEditable) {
        api.startEditingCell({ rowIndex, colKey: firstEditable as string });
      }
    });
  }, [rows.length, columns]);

  const handleDeleteSelectedRows = () => {
    const api = apiRef.current;
    if (!api) return;
    const selectedRows = new Set(api.getSelectedRows());
    const nextRows = rows.filter((row) => !selectedRows.has(row));
    onChange(nextRows);
  };

  const handleSelectionChanged = (event: SelectionChangedEvent<T>) => {
    if (!onSelectionChange) return;
    onSelectionChange(event.api.getSelectedRows());
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
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
        セルをクリックして直接編集。Excelからのコピー＆ペーストにも対応しています。
      </p>
      <div style={{ height, width: "100%" }}>
        <AgGridReact<T>
          theme={themeQuartz}
          rowData={rows}
          columnDefs={tableColumns}
          rowSelection={rowSelection}
          suppressMovableColumns={true}
          singleClickEdit
          stopEditingWhenCellsLoseFocus
          defaultColDef={{
            editable: true,
            resizable: true,
            sortable: true,
            filter: true,
            flex: 1,
            minWidth: 100
          }}
          onGridReady={handleGridReady}
          onSelectionChanged={handleSelectionChanged}
          onCellValueChanged={(event) => syncRowsFromGrid(event.api)}
          onPasteEnd={(event) => syncRowsFromGrid(event.api)}
        />
      </div>
    </div>
  );
}
