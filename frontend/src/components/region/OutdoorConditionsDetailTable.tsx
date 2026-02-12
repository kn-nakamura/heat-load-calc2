// Outdoor conditions detail table (設計用屋外条件詳細)

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
import { OutdoorConditionRecord } from '../../services/referenceData';

interface OutdoorConditionsDetailTableProps {
  data: OutdoorConditionRecord | null;
}

export const OutdoorConditionsDetailTable: React.FC<OutdoorConditionsDetailTableProps> = ({ data }) => {
  if (!data) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          設計用屋外条件
        </Typography>
        <Typography variant="body2" color="text.secondary">
          都市が選択されていません
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        設計用屋外条件 - {data.city}
      </Typography>

      {/* Cooling Conditions */}
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
        冷房設計条件
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>時刻</TableCell>
              <TableCell align="right">乾球温度 [°C]</TableCell>
              <TableCell align="right">湿球温度 [°C]</TableCell>
              <TableCell align="right">相対湿度 [%]</TableCell>
              <TableCell align="right">絶対湿度 [g/kg(DA)]</TableCell>
              <TableCell align="right">エンタルピー [kJ/kg(DA)]</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>日最高</TableCell>
              <TableCell align="right">{data.cooling_drybulb_daily_max_c.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_wetbulb_daily_max_c.toFixed(1)}</TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="right">-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>9時</TableCell>
              <TableCell align="right">{data.cooling_drybulb_9_c.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_wetbulb_9_c.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_rh_9_pct.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_abs_humidity_9_g_per_kgda.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_enthalpy_9_kj_per_kgda.toFixed(1)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>12時</TableCell>
              <TableCell align="right">{data.cooling_drybulb_12_c.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_wetbulb_12_c.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_rh_12_pct.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_abs_humidity_12_g_per_kgda.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_enthalpy_12_kj_per_kgda.toFixed(1)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>14時</TableCell>
              <TableCell align="right">{data.cooling_drybulb_14_c.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_wetbulb_14_c.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_rh_14_pct.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_abs_humidity_14_g_per_kgda.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_enthalpy_14_kj_per_kgda.toFixed(1)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>16時</TableCell>
              <TableCell align="right">{data.cooling_drybulb_16_c.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_wetbulb_16_c.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_rh_16_pct.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_abs_humidity_16_g_per_kgda.toFixed(1)}</TableCell>
              <TableCell align="right">{data.cooling_enthalpy_16_kj_per_kgda.toFixed(1)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Additional cooling info */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>最暖月の日平均外気温の最高</TableCell>
              <TableCell align="right">{data.max_monthly_mean_daily_max_c.toFixed(1)} °C</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>冷房設計用卓越風向</TableCell>
              <TableCell align="right">{data.cooling_prevailing_wind_dir}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Heating Conditions */}
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
        暖房設計条件
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>項目</TableCell>
              <TableCell align="right">乾球温度 [°C]</TableCell>
              <TableCell align="right">湿球温度 [°C]</TableCell>
              <TableCell align="right">相対湿度 [%]</TableCell>
              <TableCell align="right">絶対湿度 [g/kg(DA)]</TableCell>
              <TableCell align="right">エンタルピー [kJ/kg(DA)]</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>設計用条件</TableCell>
              <TableCell align="right">{data.heating_drybulb_c.toFixed(1)}</TableCell>
              <TableCell align="right">{data.heating_wetbulb_c.toFixed(1)}</TableCell>
              <TableCell align="right">{data.heating_rh_pct.toFixed(1)}</TableCell>
              <TableCell align="right">{data.heating_abs_humidity_g_per_kgda.toFixed(1)}</TableCell>
              <TableCell align="right">{data.heating_enthalpy_kj_per_kgda.toFixed(1)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Additional heating info */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>最寒月の日平均外気温の最低</TableCell>
              <TableCell align="right">{data.min_monthly_mean_daily_min_c.toFixed(1)} °C</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>暖房設計用卓越風向</TableCell>
              <TableCell align="right">{data.heating_prevailing_wind_dir}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
