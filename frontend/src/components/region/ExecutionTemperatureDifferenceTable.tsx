// Execution Temperature Difference (ETD) table (実行温度差)

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
  Tabs,
  Tab,
} from '@mui/material';
import { useState } from 'react';
import { ExecutionTemperatureDifferenceData } from '../../services/referenceData';

interface ExecutionTemperatureDifferenceTableProps {
  data: ExecutionTemperatureDifferenceData[string] | null;
  city: string;
}

export const ExecutionTemperatureDifferenceTable: React.FC<ExecutionTemperatureDifferenceTableProps> = ({
  data,
  city,
}) => {
  const [selectedWallType, setSelectedWallType] = useState('Ⅰ');

  if (!data) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          実行温度差 (ETD)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          都市が選択されていません
        </Typography>
      </Box>
    );
  }

  const times = ['9', '12', '14', '16'];
  const orientations = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

  // Get indoor temperature data (usually "28")
  const indoorTempKeys = Object.keys(data);
  const indoorTemp = indoorTempKeys[0] || '28';
  const tempData = data[indoorTemp];

  if (!tempData) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          実行温度差 (ETD) - {city}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          データが見つかりません
        </Typography>
      </Box>
    );
  }

  const wallTypes = Object.keys(tempData);
  const wallTypeData = tempData[selectedWallType];

  if (!wallTypeData) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          実行温度差 (ETD) - {city}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          壁種別データが見つかりません
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        実行温度差 (ETD) - {city}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        室内温度: {indoorTemp}°C
      </Typography>

      {/* Wall Type Tabs */}
      {wallTypes.length > 1 && (
        <Tabs value={selectedWallType} onChange={(_, newValue) => setSelectedWallType(newValue)} sx={{ mb: 2 }}>
          {wallTypes.map((wallType) => (
            <Tab key={wallType} label={`壁種別 ${wallType}`} value={wallType} />
          ))}
        </Tabs>
      )}

      {/* Shadow and Horizontal */}
      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
        日陰・水平面
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>項目</TableCell>
              {times.map((time) => (
                <TableCell key={time} align="right">
                  {time}時
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {wallTypeData['日陰'] && (
              <TableRow>
                <TableCell>日陰 [°C]</TableCell>
                {times.map((time) => (
                  <TableCell key={time} align="right">
                    {wallTypeData['日陰'][time]?.toFixed(1) || '-'}
                  </TableCell>
                ))}
              </TableRow>
            )}
            {wallTypeData['水平'] && (
              <TableRow>
                <TableCell>水平 [°C]</TableCell>
                {times.map((time) => (
                  <TableCell key={time} align="right">
                    {wallTypeData['水平'][time]?.toFixed(1) || '-'}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Orientation-based ETD */}
      {wallTypeData['方位別'] && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            方位別実行温度差 [°C]
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>方位</TableCell>
                  {times.map((time) => (
                    <TableCell key={time} align="right">
                      {time}時
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {orientations.map((orientation) => {
                  const orientationData = wallTypeData['方位別'][orientation];
                  if (!orientationData) return null;

                  return (
                    <TableRow key={orientation}>
                      <TableCell>{orientation}</TableCell>
                      {times.map((time) => (
                        <TableCell key={time} align="right">
                          {orientationData[time]?.toFixed(1) || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};
