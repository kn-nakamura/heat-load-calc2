// Indoor conditions table view for bulk editing

import { Box, Button } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useRef, useMemo, useCallback } from 'react';
import { IndoorConditionMaster } from '../../types';

interface IndoorConditionsTableProps {
  data: IndoorConditionMaster[];
  onUpdate: (id: string, updates: Partial<IndoorConditionMaster>) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export const IndoorConditionsTable: React.FC<IndoorConditionsTableProps> = ({
  data,
  onUpdate,
  onAdd,
  onDelete,
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const gridApiRef = useRef<GridApi | null>(null);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;
  }, []);

  const handleCellValueChanged = useCallback(
    (event: any) => {
      const { data: rowData, colDef } = event;
      const field = colDef.field;
      const id = rowData.id;

      // Handle nested fields (e.g., summer.dryBulbTemp)
      if (field.includes('.')) {
        const [parentField, childField] = field.split('.');
        const updates = {
          [parentField]: {
            ...rowData[parentField],
            [childField]: event.newValue,
          },
        };
        onUpdate(id, updates);
      } else {
        onUpdate(id, { [field]: event.newValue });
      }
    },
    [onUpdate]
  );

  const handleDeleteSelected = useCallback(() => {
    const selectedRows = gridApiRef.current?.getSelectedRows();
    if (selectedRows && selectedRows.length > 0) {
      selectedRows.forEach((row: IndoorConditionMaster) => {
        onDelete(row.id);
      });
    }
  }, [onDelete]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: '',
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 50,
        pinned: 'left',
      },
      {
        headerName: '条件名',
        field: 'name',
        editable: true,
        width: 200,
        pinned: 'left',
      },
      {
        headerName: '夏期乾球温度 [°C]',
        field: 'summer.dryBulbTemp',
        editable: true,
        type: 'numericColumn',
        valueGetter: (params) => params.data?.summer?.dryBulbTemp,
      },
      {
        headerName: '夏期湿球温度 [°C]',
        field: 'summer.wetBulbTemp',
        editable: true,
        type: 'numericColumn',
        valueGetter: (params) => params.data?.summer?.wetBulbTemp,
      },
      {
        headerName: '夏期相対湿度 [%]',
        field: 'summer.relativeHumidity',
        editable: true,
        type: 'numericColumn',
        valueGetter: (params) => params.data?.summer?.relativeHumidity,
      },
      {
        headerName: '夏期絶対湿度 [kg/kg(DA)]',
        field: 'summer.absoluteHumidity',
        editable: true,
        type: 'numericColumn',
        valueGetter: (params) => params.data?.summer?.absoluteHumidity,
        valueFormatter: (params) => params.value?.toFixed(4),
      },
      {
        headerName: '夏期エンタルピー [kJ/kg(DA)]',
        field: 'summer.enthalpy',
        editable: true,
        type: 'numericColumn',
        valueGetter: (params) => params.data?.summer?.enthalpy,
      },
      {
        headerName: '冬期乾球温度 [°C]',
        field: 'winter.dryBulbTemp',
        editable: true,
        type: 'numericColumn',
        valueGetter: (params) => params.data?.winter?.dryBulbTemp,
      },
      {
        headerName: '冬期湿球温度 [°C]',
        field: 'winter.wetBulbTemp',
        editable: true,
        type: 'numericColumn',
        valueGetter: (params) => params.data?.winter?.wetBulbTemp,
      },
      {
        headerName: '冬期相対湿度 [%]',
        field: 'winter.relativeHumidity',
        editable: true,
        type: 'numericColumn',
        valueGetter: (params) => params.data?.winter?.relativeHumidity,
      },
      {
        headerName: '冬期絶対湿度 [kg/kg(DA)]',
        field: 'winter.absoluteHumidity',
        editable: true,
        type: 'numericColumn',
        valueGetter: (params) => params.data?.winter?.absoluteHumidity,
        valueFormatter: (params) => params.value?.toFixed(4),
      },
      {
        headerName: '冬期エンタルピー [kJ/kg(DA)]',
        field: 'winter.enthalpy',
        editable: true,
        type: 'numericColumn',
        valueGetter: (params) => params.data?.winter?.enthalpy,
      },
      {
        headerName: '備考',
        field: 'remarks',
        editable: true,
        width: 200,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      width: 150,
    }),
    []
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
          行を追加
        </Button>
        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteSelected}>
          選択行を削除
        </Button>
      </Box>

      <Box className="ag-theme-alpine" sx={{ flexGrow: 1, height: 600 }}>
        <AgGridReact
          ref={gridRef}
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          onGridReady={onGridReady}
          onCellValueChanged={handleCellValueChanged}
          suppressRowClickSelection={true}
          animateRows={true}
        />
      </Box>
    </Box>
  );
};
