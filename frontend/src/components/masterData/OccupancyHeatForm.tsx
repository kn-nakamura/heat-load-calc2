// Occupancy heat master data form

import { Box, TextField, Button, Typography, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { OccupancyHeatMaster } from '../../types';
import { useMasterDataStore, useUIStore } from '../../stores';
import { masterDataService } from '../../db';

interface OccupancyHeatFormProps {
  selectedId: string | null;
}

export const OccupancyHeatForm: React.FC<OccupancyHeatFormProps> = ({ selectedId }) => {
  const { occupancyHeat, updateOccupancyHeat, deleteOccupancyHeat } = useMasterDataStore();
  const { showSnackbar } = useUIStore();

  const selectedItem = occupancyHeat.find((item) => item.id === selectedId);

  const [formData, setFormData] = useState<Partial<OccupancyHeatMaster>>({
    name: '',
    summer: {
      sensibleHeat: 60,
      latentHeat: 50,
      totalHeat: 110,
    },
    winter: {
      sensibleHeat: 60,
      latentHeat: 50,
      totalHeat: 110,
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

  const handleNestedChange = (season: 'summer' | 'winter', field: string, value: number) => {
    setFormData((prev) => {
      const seasonData = { ...prev[season]!, [field]: value };
      // Auto-calculate total heat
      if (field === 'sensibleHeat' || field === 'latentHeat') {
        seasonData.totalHeat = (seasonData.sensibleHeat || 0) + (seasonData.latentHeat || 0);
      }
      return {
        ...prev,
        [season]: seasonData,
      };
    });
  };

  const handleSave = async () => {
    if (!selectedId || !formData.name) {
      showSnackbar('名前を入力してください', 'error');
      return;
    }

    try {
      updateOccupancyHeat(selectedId, formData);
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
      deleteOccupancyHeat(selectedId);
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
        <Typography variant="h6">人体発熱量</Typography>
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

        {/* Summer */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" gutterBottom>
            夏期発熱量 [W/人]
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="顕熱"
            value={formData.summer?.sensibleHeat || ''}
            onChange={(e) => handleNestedChange('summer', 'sensibleHeat', parseFloat(e.target.value))}
            inputProps={{ step: 1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="潜熱"
            value={formData.summer?.latentHeat || ''}
            onChange={(e) => handleNestedChange('summer', 'latentHeat', parseFloat(e.target.value))}
            inputProps={{ step: 1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="全熱"
            value={formData.summer?.totalHeat || ''}
            InputProps={{ readOnly: true }}
            helperText="自動計算"
          />
        </Grid>

        {/* Winter */}
        <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            冬期発熱量 [W/人]
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="顕熱"
            value={formData.winter?.sensibleHeat || ''}
            onChange={(e) => handleNestedChange('winter', 'sensibleHeat', parseFloat(e.target.value))}
            inputProps={{ step: 1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="潜熱"
            value={formData.winter?.latentHeat || ''}
            onChange={(e) => handleNestedChange('winter', 'latentHeat', parseFloat(e.target.value))}
            inputProps={{ step: 1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="全熱"
            value={formData.winter?.totalHeat || ''}
            InputProps={{ readOnly: true }}
            helperText="自動計算"
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
