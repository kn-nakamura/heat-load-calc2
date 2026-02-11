// Indoor data page (屋内データ)

import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import { useUIStore, IndoorDataTab } from '../stores';

const tabs: { id: IndoorDataTab; label: string }[] = [
  { id: 'indoor-conditions', label: '設計用屋内条件' },
  { id: 'lighting-power', label: '照明器具の消費電力' },
  { id: 'occupancy-heat', label: '人体発熱量' },
  { id: 'equipment-power', label: '事務機器・OA機器の消費電力' },
  { id: 'non-air-conditioned-temp-diff', label: '非空調室差温度' },
];

export const IndoorDataPage: React.FC = () => {
  const { indoorDataTab, setIndoorDataTab } = useUIStore();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: IndoorDataTab) => {
    setIndoorDataTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        屋内データ
      </Typography>
      <Paper sx={{ mt: 2 }}>
        <Tabs value={indoorDataTab} onChange={handleTabChange}>
          {tabs.map((tab) => (
            <Tab key={tab.id} label={tab.label} value={tab.id} />
          ))}
        </Tabs>
        <Box sx={{ p: 3 }}>
          <Typography>
            {tabs.find((t) => t.id === indoorDataTab)?.label}マスタデータ
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
