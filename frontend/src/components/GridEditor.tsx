import { useMemo, useRef } from "react";
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  SelectionChangedEvent
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

interface GridEditorProps<T extends object> {
  title: string;
  rows: T[];
  columns: ColDef<T>[];
  createEmptyRow: () => T;
  onChange: (rows: T[]) => void;
}

const EMPTY_DISPLAY_ROWS = 20;

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

function isRowEmpty<T extends object>(row: T): boolean {
  return Object.values(row as Record<string, unknown>).every((value) => isEmptyValue(value));
}

export default function GridEditor<T extends object>({
  title,
  rows,
  columns,
  createEmptyRow,
  onChange
}: GridEditorProps<T>) {
  const apiRef = useRef<GridApi<T> | null>(null);

  const displayRows = useMemo(() => {
    const filledRows = rows.map((row) => ({ ...row }));
    const blankCount = Math.max(EMPTY_DISPLAY_ROWS - filledRows.length, 2);
    const blanks = Array.from({ length: blankCount }, () => createEmptyRow());
    return [...filledRows, ...blanks];
  }, [createEmptyRow, rows]);

  const tableColumns = useMemo<ColDef<T>[]>(() => {
    const rowNoCol: ColDef<T> = {
      headerName: "#",
      width: 56,
      minWidth: 56,
      maxWidth: 70,
      pinned: "left",
      editable: false,
      sortable: false,
      filter: false,
      resizable: false,
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
      cellClass: "row-number-cell"
    };
    return [rowNoCol, ...columns];
  }, [columns]);

  const syncRowsFromGrid = (api: GridApi<T>) => {
    const nextRows: T[] = [];
    api.forEachNode((node) => {
      if (!node.data) {
        return;
      }
      const row = node.data as T;
      if (!isRowEmpty(row)) {
        nextRows.push(row);
      }
    });
    onChange(nextRows);
  };

  const handleGridReady = (event: GridReadyEvent<T>) => {
    apiRef.current = event.api;
  };

  const handleAddRow = () => {
    onChange([...rows, createEmptyRow()]);
    requestAnimationFrame(() => {
      const api = apiRef.current;
      if (!api) {
        return;
      }
      const rowIndex = rows.length;
      api.ensureIndexVisible(rowIndex, "bottom");
      const firstEditable = columns.find((col) => col.field)?.field;
      if (firstEditable) {
        api.startEditingCell({ rowIndex, colKey: firstEditable as string });
      }
    });
  };

  const handleDeleteSelectedRows = () => {
    const api = apiRef.current;
    if (!api) {
      return;
    }
    const selectedRows = new Set(api.getSelectedRows());
    const nextRows = rows.filter((row) => !selectedRows.has(row));
    onChange(nextRows);
  };

  const handleSelectionChanged = (_event: SelectionChangedEvent<T>) => {
    // Reserved for future status display.
  };

  return (
    <section className="grid-panel">
      <div className="grid-toolbar">
        <h3>{title}</h3>
        <div className="grid-actions">
          <button type="button" onClick={handleAddRow}>
            Add Row
          </button>
          <button type="button" className="subtle-button" onClick={handleDeleteSelectedRows}>
            Delete Selected
          </button>
        </div>
      </div>
      <p className="grid-hint">
        Click cells to edit. Multi-cell copy/paste from Excel is supported.
      </p>
      <div className="ag-theme-quartz grid-body">
        <AgGridReact<T>
          rowData={displayRows}
          columnDefs={tableColumns}
          rowSelection="multiple"
          singleClickEdit
          stopEditingWhenCellsLoseFocus
          defaultColDef={{
            editable: true,
            resizable: true,
            sortable: true,
            filter: true
          }}
          onGridReady={handleGridReady}
          onSelectionChanged={handleSelectionChanged}
          onCellValueChanged={(event) => {
            syncRowsFromGrid(event.api);
          }}
          onPasteEnd={(event) => {
            syncRowsFromGrid(event.api);
          }}
        />
      </div>
    </section>
  );
}
