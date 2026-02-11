// Design conditions page (設計条件)

import { Box, Typography, Paper } from '@mui/material';

export const DesignConditionsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        設計条件
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography>
          設計条件ページ - 建物情報、設計条件、外気条件などを設定します
        </Typography>
      </Paper>
    </Box>
  );
};
