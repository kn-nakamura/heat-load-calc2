// Envelope components table for room

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { EnvelopeRow, Orientation, EnvelopeComponentType } from '../../types';
import { useMasterDataStore } from '../../stores';

interface EnvelopeTableProps {
  rows: EnvelopeRow[];
  onChange: (rows: EnvelopeRow[]) => void;
}

const orientations: Orientation[] = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'H', null];

const componentTypeLabels: Record<EnvelopeComponentType, string> = {
  overhang: 'ひさし',
  window: '窓ガラス',
  exteriorWall: '外壁',
  roof: '屋根',
  pilotiFloor: 'ピロティ床',
  interiorWall: '内壁',
  ceilingFloor: '天井・床',
  undergroundWall: '地中壁',
  earthFloor: '土間床',
};

export const EnvelopeTable: React.FC<EnvelopeTableProps> = ({ rows, onChange }) => {
  const {
    overhangs,
    windowGlass,
    exteriorWalls,
    roofs,
    pilotiFloors,
    interiorWalls,
    ceilingFloors,
    undergroundWalls,
    earthFloors,
    nonAirConditionedTempDiff,
  } = useMasterDataStore();

  const handleRowChange = (rowNumber: number, field: keyof EnvelopeRow, value: any) => {
    const updatedRows = rows.map((row) => {
      if (row.rowNumber === rowNumber) {
        const updated = { ...row, [field]: value };

        // Auto-calculate area when width or height changes
        if (field === 'width' || field === 'height') {
          const width = field === 'width' ? value : row.width;
          const height = field === 'height' ? value : row.height;
          if (width && height) {
            updated.area = parseFloat((width * height).toFixed(2));
          }
        }

        // Calculate total area
        updated.totalArea = (updated.area || 0) + (updated.overhangArea || 0);

        return updated;
      }
      return row;
    });

    onChange(updatedRows);
  };

  const handleAddRow = () => {
    const newRow: EnvelopeRow = {
      rowNumber: rows.length > 0 ? Math.max(...rows.map((r) => r.rowNumber)) + 1 : 1,
      orientation: null,
      code: null,
      codeType: null,
      width: null,
      height: null,
      area: null,
      overhangArea: null,
      totalArea: 0,
      overhangCode: null,
      nonAirConditionedDiff: null,
      undergroundDepth: null,
      remarks: '',
    };

    onChange([...rows, newRow]);
  };

  const handleDeleteRow = (rowNumber: number) => {
    onChange(rows.filter((row) => row.rowNumber !== rowNumber));
  };

  const getCodeOptions = (codeType: EnvelopeComponentType | null) => {
    if (!codeType) return [];

    switch (codeType) {
      case 'overhang':
        return overhangs;
      case 'window':
        return windowGlass;
      case 'exteriorWall':
        return exteriorWalls;
      case 'roof':
        return roofs;
      case 'pilotiFloor':
        return pilotiFloors;
      case 'interiorWall':
        return interiorWalls;
      case 'ceilingFloor':
        return ceilingFloors;
      case 'undergroundWall':
        return undergroundWalls;
      case 'earthFloor':
        return earthFloors;
      default:
        return [];
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<AddIcon />} onClick={handleAddRow} variant="outlined" size="small">
          行追加
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>方位</TableCell>
              <TableCell>種類</TableCell>
              <TableCell>コード</TableCell>
              <TableCell>幅[m]</TableCell>
              <TableCell>高さ[m]</TableCell>
              <TableCell>面積[m²]</TableCell>
              <TableCell>ひさし面積[m²]</TableCell>
              <TableCell>合計面積[m²]</TableCell>
              <TableCell>ひさしコード</TableCell>
              <TableCell>非空調差温度</TableCell>
              <TableCell>備考</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.rowNumber}>
                <TableCell>{row.rowNumber}</TableCell>

                {/* Orientation */}
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={row.orientation || ''}
                      onChange={(e) => handleRowChange(row.rowNumber, 'orientation', e.target.value || null)}
                      displayEmpty
                    >
                      <MenuItem value="">-</MenuItem>
                      {orientations.map((o) => (
                        <MenuItem key={o || 'null'} value={o || ''}>
                          {o || '-'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>

                {/* Component Type */}
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={row.codeType || ''}
                      onChange={(e) => {
                        handleRowChange(row.rowNumber, 'codeType', e.target.value || null);
                        handleRowChange(row.rowNumber, 'code', null); // Reset code when type changes
                      }}
                      displayEmpty
                    >
                      <MenuItem value="">-</MenuItem>
                      {Object.entries(componentTypeLabels).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>

                {/* Code */}
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={row.code || ''}
                      onChange={(e) => handleRowChange(row.rowNumber, 'code', e.target.value || null)}
                      displayEmpty
                      disabled={!row.codeType}
                    >
                      <MenuItem value="">-</MenuItem>
                      {getCodeOptions(row.codeType).map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>

                {/* Width */}
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={row.width || ''}
                    onChange={(e) => handleRowChange(row.rowNumber, 'width', parseFloat(e.target.value) || null)}
                    inputProps={{ step: 0.1, style: { width: 60 } }}
                  />
                </TableCell>

                {/* Height */}
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={row.height || ''}
                    onChange={(e) => handleRowChange(row.rowNumber, 'height', parseFloat(e.target.value) || null)}
                    inputProps={{ step: 0.1, style: { width: 60 } }}
                  />
                </TableCell>

                {/* Area (calculated) */}
                <TableCell>{row.area?.toFixed(2) || '-'}</TableCell>

                {/* Overhang Area */}
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={row.overhangArea || ''}
                    onChange={(e) => handleRowChange(row.rowNumber, 'overhangArea', parseFloat(e.target.value) || null)}
                    inputProps={{ step: 0.1, style: { width: 60 } }}
                  />
                </TableCell>

                {/* Total Area (calculated) */}
                <TableCell>{row.totalArea.toFixed(2)}</TableCell>

                {/* Overhang Code */}
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={row.overhangCode || ''}
                      onChange={(e) => handleRowChange(row.rowNumber, 'overhangCode', e.target.value || null)}
                      displayEmpty
                    >
                      <MenuItem value="">-</MenuItem>
                      {overhangs.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>

                {/* Non Air Conditioned Diff */}
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={row.nonAirConditionedDiff || ''}
                      onChange={(e) => handleRowChange(row.rowNumber, 'nonAirConditionedDiff', e.target.value || null)}
                      displayEmpty
                    >
                      <MenuItem value="">-</MenuItem>
                      {nonAirConditionedTempDiff.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>

                {/* Remarks */}
                <TableCell>
                  <TextField
                    size="small"
                    value={row.remarks || ''}
                    onChange={(e) => handleRowChange(row.rowNumber, 'remarks', e.target.value)}
                    inputProps={{ style: { width: 100 } }}
                  />
                </TableCell>

                {/* Delete */}
                <TableCell>
                  <IconButton size="small" onClick={() => handleDeleteRow(row.rowNumber)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
