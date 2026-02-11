// Ground temperature data table

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  Box,
  Button,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface GroundTemperature {
  depth: number;
  summer: number;
  winter: number;
}

interface GroundTemperatureTableProps {
  data: GroundTemperature[];
  onChange: (data: GroundTemperature[]) => void;
  readonly?: boolean;
}

export const GroundTemperatureTable: React.FC<GroundTemperatureTableProps> = ({
  data,
  onChange,
  readonly = false,
}) => {
  const handleChange = (depth: number, field: 'summer' | 'winter', value: number) => {
    const updatedData = data.map((item) => (item.depth === depth ? { ...item, [field]: value } : item));
    onChange(updatedData);
  };

  const handleDepthChange = (oldDepth: number, newDepth: number) => {
    const updatedData = data.map((item) => (item.depth === oldDepth ? { ...item, depth: newDepth } : item));
    onChange(updatedData);
  };

  const handleAddRow = () => {
    const maxDepth = data.length > 0 ? Math.max(...data.map((d) => d.depth)) : 0;
    const newRow: GroundTemperature = {
      depth: maxDepth + 1,
      summer: 15,
      winter: 15,
    };
    onChange([...data, newRow]);
  };

  const handleDeleteRow = (depth: number) => {
    onChange(data.filter((item) => item.depth !== depth));
  };

  // Sort by depth
  const sortedData = [...data].sort((a, b) => a.depth - b.depth);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">地中温度</Typography>
        {!readonly && (
          <Button startIcon={<AddIcon />} onClick={handleAddRow} variant="outlined" size="small">
            深度追加
          </Button>
        )}
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>深度 [m]</TableCell>
              <TableCell align="right">夏期温度 [°C]</TableCell>
              <TableCell align="right">冬期温度 [°C]</TableCell>
              {!readonly && <TableCell align="center">操作</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((row) => (
              <TableRow key={row.depth}>
                <TableCell>
                  {readonly ? (
                    row.depth.toFixed(1)
                  ) : (
                    <TextField
                      type="number"
                      value={row.depth}
                      onChange={(e) => handleDepthChange(row.depth, parseFloat(e.target.value) || 0)}
                      inputProps={{ step: 0.1, style: { textAlign: 'right' } }}
                      size="small"
                      sx={{ width: 100 }}
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  {readonly ? (
                    row.summer.toFixed(1)
                  ) : (
                    <TextField
                      type="number"
                      value={row.summer}
                      onChange={(e) => handleChange(row.depth, 'summer', parseFloat(e.target.value) || 0)}
                      inputProps={{ step: 0.1, style: { textAlign: 'right' } }}
                      size="small"
                      sx={{ width: 100 }}
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  {readonly ? (
                    row.winter.toFixed(1)
                  ) : (
                    <TextField
                      type="number"
                      value={row.winter}
                      onChange={(e) => handleChange(row.depth, 'winter', parseFloat(e.target.value) || 0)}
                      inputProps={{ step: 0.1, style: { textAlign: 'right' } }}
                      size="small"
                      sx={{ width: 100 }}
                    />
                  )}
                </TableCell>
                {!readonly && (
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleDeleteRow(row.depth)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {sortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={readonly ? 3 : 4} align="center">
                  <Typography variant="body2" color="text.secondary">
                    データがありません
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
