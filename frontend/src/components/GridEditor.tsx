import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

interface GridEditorProps<T extends object> {
  title: string;
  rows: T[];
  columns: ColDef<T>[];
  onChange: (rows: T[]) => void;
}

export default function GridEditor<T extends object>({ title, rows, columns, onChange }: GridEditorProps<T>) {
  return (
    <section className="grid-panel">
      <h3>{title}</h3>
      <div className="ag-theme-quartz" style={{ height: 300, width: "100%" }}>
        <AgGridReact<T>
          rowData={rows}
          columnDefs={columns}
          defaultColDef={{
            editable: true,
            resizable: true,
            sortable: true,
            filter: true
          }}
          onCellValueChanged={(event) => {
            const updated: T[] = [];
            event.api.forEachNode((node) => {
              if (node.data) {
                updated.push(node.data as T);
              }
            });
            onChange(updated);
          }}
        />
      </div>
    </section>
  );
}
