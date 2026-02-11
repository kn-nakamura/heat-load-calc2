// Region data page (地区データ)

import { Box, Typography, Paper, Button, Divider } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useProjectStore, useUIStore } from '../stores';
import { MonthlyTemperatureTable, SolarRadiationTable, GroundTemperatureTable } from '../components/region';
import { RegionClimateData } from '../types';
import { masterDataService } from '../db';

export const RegionDataPage: React.FC = () => {
  const { currentProject, updateRegionClimateData } = useProjectStore();
  const { showSnackbar } = useUIStore();

  const [formData, setFormData] = useState<RegionClimateData | null>(null);

  useEffect(() => {
    if (currentProject) {
      if (currentProject.regionClimateData) {
        setFormData(currentProject.regionClimateData);
      } else {
        // Initialize with default data based on design conditions region
        const region = currentProject.designConditions.region;
        const newData: RegionClimateData = {
          region: region,
          monthlyTemperatures: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            dryBulbTemp: 0,
            relativeHumidity: 50,
          })),
          solarRadiation: [],
          groundTemperatures: [
            { depth: 0.5, summer: 15, winter: 15 },
            { depth: 1.0, summer: 15, winter: 15 },
            { depth: 2.0, summer: 15, winter: 15 },
          ],
        };
        setFormData(newData);
      }
    }
  }, [currentProject]);

  const handleSave = async () => {
    if (!formData) {
      showSnackbar('データがありません', 'error');
      return;
    }

    try {
      updateRegionClimateData(formData);
      await masterDataService.saveAllMasterData();
      showSnackbar('保存しました', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showSnackbar('保存に失敗しました', 'error');
    }
  };

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          プロジェクトが読み込まれていません。設計条件ページで新規プロジェクトを作成してください。
        </Typography>
      </Box>
    );
  }

  if (!formData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4">地区データ</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            地域: {formData.region}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
          保存
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <MonthlyTemperatureTable
          data={formData.monthlyTemperatures}
          onChange={(data) => setFormData({ ...formData, monthlyTemperatures: data })}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <SolarRadiationTable
          data={formData.solarRadiation}
          onChange={(data) => setFormData({ ...formData, solarRadiation: data })}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <GroundTemperatureTable
          data={formData.groundTemperatures}
          onChange={(data) => setFormData({ ...formData, groundTemperatures: data })}
        />
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave}>
          保存
        </Button>
      </Box>
    </Box>
  );
};
