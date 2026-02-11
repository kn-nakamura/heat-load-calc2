// Room registration page (室登録)

import { Box, Typography, Paper } from '@mui/material';

export const RoomRegistrationPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        室登録
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography>
          室登録ページ - 各室の詳細情報を登録します
        </Typography>
      </Paper>
    </Box>
  );
};
