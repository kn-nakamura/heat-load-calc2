// Lighting power master data form

import { Box, TextField, Button, Typography, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { LightingPowerMaster } from '../../types';
import { useMasterDataStore, useUIStore } from '../../stores';
import { masterDataService } from '../../db';

interface LightingPowerFormProps {
  selectedId: string | null;
}

export const LightingPowerForm: React.FC<LightingPowerFormProps> = ({ selectedId }) => {
  const { lightingPower, updateLightingPower, deleteLightingPower } = useMasterDataStore();
  const { showSnackbar } = useUIStore();

  const selectedItem = lightingPower.find((item) => item.id === selectedId);

  const [formData, setFormData] = useState<Partial<LightingPowerMaster>>({
    name: '',
    designIlluminance: 500,
    powerDensity: {
      fluorescentDownlight: 15,
      fluorescentLouver: 18,
      fluorescentAcrylicCover: 16,
      ledDownlight: 8,
      ledLouver: 10,
    },
    remarks: '',
  });

  useEffect(() => {
    if (selectedItem) {
      setFormData(selectedItem);
    }
  }, [selectedItem]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePowerDensityChange = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      powerDensity: {
        ...prev.powerDensity!,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedId || !formData.name) {
      showSnackbar('名前を入力してください', 'error');
      return;
    }

    try {
      updateLightingPower(selectedId, formData);
      await masterDataService.saveAllMasterData();
      showSnackbar('保存しました', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showSnackbar('保存に失敗しました', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!window.confirm('本当に削除しますか？')) return;

    try {
      deleteLightingPower(selectedId);
      await masterDataService.saveAllMasterData();
      showSnackbar('削除しました', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showSnackbar('削除に失敗しました', 'error');
    }
  };

  if (!selectedId) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          左のリストから項目を選択してください
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">照明器具の消費電力</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
            削除
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
            保存
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="名称"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="設計照度 [lx]"
            value={formData.designIlluminance || ''}
            onChange={(e) => handleChange('designIlluminance', parseFloat(e.target.value))}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" gutterBottom>
            消費電力密度 [W/m²]
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="蛍光灯ダウンライト"
            value={formData.powerDensity?.fluorescentDownlight || ''}
            onChange={(e) => handlePowerDensityChange('fluorescentDownlight', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="蛍光灯ルーバー天井"
            value={formData.powerDensity?.fluorescentLouver || ''}
            onChange={(e) => handlePowerDensityChange('fluorescentLouver', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="蛍光灯アクリルカバー"
            value={formData.powerDensity?.fluorescentAcrylicCover || ''}
            onChange={(e) => handlePowerDensityChange('fluorescentAcrylicCover', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="LEDダウンライト"
            value={formData.powerDensity?.ledDownlight || ''}
            onChange={(e) => handlePowerDensityChange('ledDownlight', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="LEDルーバー天井"
            value={formData.powerDensity?.ledLouver || ''}
            onChange={(e) => handlePowerDensityChange('ledLouver', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="備考"
            value={formData.remarks || ''}
            onChange={(e) => handleChange('remarks', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
