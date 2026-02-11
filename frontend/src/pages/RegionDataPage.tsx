// Region data page (地区データ)

import { Box, Typography, Paper } from '@mui/material';

export const RegionDataPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        地区データ
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography>
          地区データページ - 地域別の気象データ、日射データなどを表示します
        </Typography>
      </Paper>
    </Box>
  );
};
