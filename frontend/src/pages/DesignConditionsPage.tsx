// Design conditions page (設計条件)

import { Box, Typography, Paper, Button, Divider } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useProjectStore, useUIStore } from '../stores';
import {
  BuildingInfoForm,
  LocationSettingsForm,
  OutdoorConditionsForm,
  CalculationSettingsForm,
} from '../components/design';
import { DesignConditions } from '../types';
import { masterDataService } from '../db';

export const DesignConditionsPage: React.FC = () => {
  const { currentProject, updateDesignConditions, createNewProject } = useProjectStore();
  const { showSnackbar } = useUIStore();

  const [formData, setFormData] = useState<DesignConditions | null>(null);

  useEffect(() => {
    // Create a new project if none exists
    if (!currentProject) {
      createNewProject('新規プロジェクト');
    }
  }, [currentProject, createNewProject]);

  useEffect(() => {
    if (currentProject) {
      setFormData(currentProject.designConditions);
    }
  }, [currentProject]);

  const handleChange = (field: keyof DesignConditions, value: any) => {
    if (!formData) return;
    setFormData((prev) => ({ ...prev!, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData) {
      showSnackbar('データがありません', 'error');
      return;
    }

    if (!formData.buildingName) {
      showSnackbar('建物名称を入力してください', 'error');
      return;
    }

    try {
      updateDesignConditions(formData);
      await masterDataService.saveAllMasterData();
      showSnackbar('保存しました', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showSnackbar('保存に失敗しました', 'error');
    }
  };

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
        <Typography variant="h4">設計条件</Typography>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
          保存
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        {/* Building Information */}
        <BuildingInfoForm formData={formData} onChange={handleChange} />

        <Divider sx={{ my: 4 }} />

        {/* Location Settings */}
        <LocationSettingsForm formData={formData} onChange={handleChange} />

        <Divider sx={{ my: 4 }} />

        {/* Outdoor Design Conditions */}
        <OutdoorConditionsForm formData={formData} onChange={handleChange} />

        <Divider sx={{ my: 4 }} />

        {/* Calculation Settings */}
        <CalculationSettingsForm formData={formData} onChange={handleChange} />

        {/* Save button at bottom */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave}>
            保存
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
