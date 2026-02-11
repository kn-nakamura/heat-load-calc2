// Glass and structure page (窓ガラス・構造体)

import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { useUIStore, GlassStructureTab } from '../stores';

const tabs: { id: GlassStructureTab; label: string }[] = [
  { id: 'overhang', label: 'ひさし' },
  { id: 'window-glass', label: '窓ガラス' },
  { id: 'exterior-wall', label: '外壁' },
  { id: 'roof', label: '屋根' },
  { id: 'piloti-floor', label: 'ピロティ床' },
  { id: 'interior-wall', label: '内壁' },
  { id: 'ceiling-floor', label: '天井・床' },
  { id: 'underground-wall', label: '地中壁' },
  { id: 'earth-floor', label: '土間床' },
];

export const GlassStructurePage: React.FC = () => {
  const { glassStructureTab, setGlassStructureTab } = useUIStore();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: GlassStructureTab) => {
    setGlassStructureTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        窓ガラス・構造体
      </Typography>
      <Paper sx={{ mt: 2 }}>
        <Tabs value={glassStructureTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {tabs.map((tab) => (
            <Tab key={tab.id} label={tab.label} value={tab.id} />
          ))}
        </Tabs>
        <Box sx={{ p: 3 }}>
          <Typography>
            {tabs.find((t) => t.id === glassStructureTab)?.label}マスタデータ
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
