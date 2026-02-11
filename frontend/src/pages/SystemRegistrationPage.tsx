// System registration page (系統登録)

import { Box, Typography, Paper } from '@mui/material';

export const SystemRegistrationPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        系統登録
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography>
          系統登録ページ - 系統の階層構造と室の割り当てを管理します
        </Typography>
      </Paper>
    </Box>
  );
};
