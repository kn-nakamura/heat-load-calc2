// Standard solar gain table (標準日射熱取得)

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
  Divider,
} from '@mui/material';
import { StandardSolarGainData } from '../../services/referenceData';

interface StandardSolarGainTableProps {
  data: StandardSolarGainData[string] | null;
  city: string;
}

export const StandardSolarGainTable: React.FC<StandardSolarGainTableProps> = ({ data, city }) => {
  console.log('StandardSolarGainTable - city:', city);
  console.log('StandardSolarGainTable - data:', data);

  if (!data) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          標準日射熱取得
        </Typography>
        <Typography variant="body2" color="text.secondary">
          都市が選択されていません (data is null)
        </Typography>
      </Box>
    );
  }

  const times = ['9', '12', '14', '16'];
  const orientations = [
    '日影', '水平', 'N', 'NNE', 'NE', 'ENE', 'E', 'ESE',
    'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];

  // Extract solar altitude and azimuth
  const solarAltitude = data._solar_altitude_deg || {};
  const solarAzimuth = data._solar_azimuth_deg || {};

  console.log('StandardSolarGainTable - solarAltitude:', solarAltitude);
  console.log('StandardSolarGainTable - solarAzimuth:', solarAzimuth);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        標準日射熱取得 - {city}
      </Typography>

      {/* Solar Position */}
      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
        太陽位置
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
            <TableRow>
              <TableCell>太陽高度 [°]</TableCell>
              {times.map((time) => (
                <TableCell key={time} align="right">
                  {solarAltitude[time]?.toFixed(1) || '-'}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>太陽方位角 [°]</TableCell>
              {times.map((time) => (
                <TableCell key={time} align="right">
                  {solarAzimuth[time]?.toFixed(1) || '-'}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Solar Radiation by Orientation */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        方位別日射熱取得 [W/m²]
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
              const orientationData = data[orientation];
              if (!orientationData) return null;

              return (
                <TableRow key={orientation}>
                  <TableCell sx={{ fontWeight: orientation === '水平' ? 'bold' : 'normal' }}>
                    {orientation}
                  </TableCell>
                  {times.map((time) => (
                    <TableCell key={time} align="right">
                      {orientationData[time]?.toFixed(0) || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
