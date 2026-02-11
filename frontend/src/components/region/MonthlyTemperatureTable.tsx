// Monthly temperature data table

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
} from '@mui/material';

interface MonthlyTemperature {
  month: number;
  dryBulbTemp: number;
  relativeHumidity: number;
}

interface MonthlyTemperatureTableProps {
  data: MonthlyTemperature[];
  onChange: (data: MonthlyTemperature[]) => void;
  readonly?: boolean;
}

const monthNames = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
];

export const MonthlyTemperatureTable: React.FC<MonthlyTemperatureTableProps> = ({
  data,
  onChange,
  readonly = false,
}) => {
  const handleChange = (month: number, field: 'dryBulbTemp' | 'relativeHumidity', value: number) => {
    const updatedData = data.map((item) =>
      item.month === month ? { ...item, [field]: value } : item
    );
    onChange(updatedData);
  };

  // Ensure we have data for all 12 months
  const completeData = monthNames.map((_, index) => {
    const month = index + 1;
    const existing = data.find((d) => d.month === month);
    return existing || { month, dryBulbTemp: 0, relativeHumidity: 0 };
  });

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        月別外気温湿度
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>月</TableCell>
              <TableCell align="right">乾球温度 [°C]</TableCell>
              <TableCell align="right">相対湿度 [%]</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {completeData.map((row) => (
              <TableRow key={row.month}>
                <TableCell>{monthNames[row.month - 1]}</TableCell>
                <TableCell align="right">
                  {readonly ? (
                    row.dryBulbTemp.toFixed(1)
                  ) : (
                    <TextField
                      type="number"
                      value={row.dryBulbTemp}
                      onChange={(e) => handleChange(row.month, 'dryBulbTemp', parseFloat(e.target.value) || 0)}
                      inputProps={{ step: 0.1, style: { textAlign: 'right' } }}
                      size="small"
                      sx={{ width: 100 }}
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  {readonly ? (
                    row.relativeHumidity.toFixed(1)
                  ) : (
                    <TextField
                      type="number"
                      value={row.relativeHumidity}
                      onChange={(e) => handleChange(row.month, 'relativeHumidity', parseFloat(e.target.value) || 0)}
                      inputProps={{ step: 0.1, style: { textAlign: 'right' } }}
                      size="small"
                      sx={{ width: 100 }}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
