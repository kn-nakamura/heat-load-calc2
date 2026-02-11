// Load check page (負荷確認)

import { Box, Typography, Paper } from '@mui/material';

export const LoadCheckPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        負荷確認
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography>
          負荷確認ページ - 計算結果の確認と分析を行います
        </Typography>
      </Paper>
    </Box>
  );
};
