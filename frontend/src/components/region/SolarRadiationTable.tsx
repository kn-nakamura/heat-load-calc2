// Solar radiation data table

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

interface SolarRadiation {
  month: number;
  orientation: string;
  radiation: number;
}

interface SolarRadiationTableProps {
  data: SolarRadiation[];
  onChange: (data: SolarRadiation[]) => void;
  readonly?: boolean;
}

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const orientations = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'H'];

export const SolarRadiationTable: React.FC<SolarRadiationTableProps> = ({ data, onChange, readonly = false }) => {
  const handleChange = (month: number, orientation: string, value: number) => {
    const existing = data.find((d) => d.month === month && d.orientation === orientation);
    let updatedData: SolarRadiation[];

    if (existing) {
      updatedData = data.map((item) =>
        item.month === month && item.orientation === orientation ? { ...item, radiation: value } : item
      );
    } else {
      updatedData = [...data, { month, orientation, radiation: value }];
    }

    onChange(updatedData);
  };

  const getRadiation = (month: number, orientation: string): number => {
    const item = data.find((d) => d.month === month && d.orientation === orientation);
    return item ? item.radiation : 0;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        月別方位別日射量
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>月</TableCell>
              {orientations.map((orientation) => (
                <TableCell key={orientation} align="right">
                  {orientation}
                  <br />
                  [W/m²]
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {monthNames.map((monthName, index) => {
              const month = index + 1;
              return (
                <TableRow key={month}>
                  <TableCell>{monthName}</TableCell>
                  {orientations.map((orientation) => (
                    <TableCell key={orientation} align="right">
                      {readonly ? (
                        getRadiation(month, orientation).toFixed(0)
                      ) : (
                        <TextField
                          type="number"
                          value={getRadiation(month, orientation)}
                          onChange={(e) => handleChange(month, orientation, parseFloat(e.target.value) || 0)}
                          inputProps={{ step: 1, style: { textAlign: 'right' } }}
                          size="small"
                          sx={{ width: 80 }}
                        />
                      )}
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
