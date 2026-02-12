// Heating ground temperature table (暖房設計用地中温度)

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import { HeatingGroundTemperatureRecord } from '../../services/referenceData';

interface HeatingGroundTemperatureTableProps {
  data: HeatingGroundTemperatureRecord | null;
}

export const HeatingGroundTemperatureTable: React.FC<HeatingGroundTemperatureTableProps> = ({ data }) => {
  if (!data) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          暖房設計用地中温度
        </Typography>
        <Typography variant="body2" color="text.secondary">
          都市が選択されていません
        </Typography>
      </Box>
    );
  }

  // Convert the depth map to a sorted array
  const depthEntries = Object.entries(data.temperatures_c_by_depth_m)
    .map(([depth, temp]) => ({
      depth: parseFloat(depth),
      temperature: temp,
    }))
    .sort((a, b) => a.depth - b.depth);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        暖房設計用地中温度 - {data.city}
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>深度 [m]</TableCell>
              <TableCell align="right">温度 [°C]</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {depthEntries.map((entry) => (
              <TableRow key={entry.depth}>
                <TableCell>{entry.depth.toFixed(1)}</TableCell>
                <TableCell align="right">{entry.temperature.toFixed(1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
