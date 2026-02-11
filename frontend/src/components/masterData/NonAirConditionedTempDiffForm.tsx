// Non-air conditioned temperature difference master data form

import { Box, TextField, Button, Typography, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { NonAirConditionedTempDiffMaster } from '../../types';
import { useMasterDataStore, useUIStore } from '../../stores';
import { masterDataService } from '../../db';

interface NonAirConditionedTempDiffFormProps {
  selectedId: string | null;
}

export const NonAirConditionedTempDiffForm: React.FC<NonAirConditionedTempDiffFormProps> = ({ selectedId }) => {
  const { nonAirConditionedTempDiff, updateNonAirConditionedTempDiff, deleteNonAirConditionedTempDiff } = useMasterDataStore();
  const { showSnackbar } = useUIStore();

  const selectedItem = nonAirConditionedTempDiff.find((item) => item.id === selectedId);

  const [formData, setFormData] = useState<Partial<NonAirConditionedTempDiffMaster>>({
    name: '',
    summer: {
      tempDiff: 5,
    },
    winter: {
      tempDiff: -5,
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

  const handleNestedChange = (season: 'summer' | 'winter', value: number) => {
    setFormData((prev) => ({
      ...prev,
      [season]: {
        tempDiff: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedId || !formData.name) {
      showSnackbar('名前を入力してください', 'error');
      return;
    }

    try {
      updateNonAirConditionedTempDiff(selectedId, formData);
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
      deleteNonAirConditionedTempDiff(selectedId);
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
        <Typography variant="h6">非空調室差温度</Typography>
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

        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" gutterBottom>
            夏期温度差 [K]
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="温度差"
            value={formData.summer?.tempDiff || ''}
            onChange={(e) => handleNestedChange('summer', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
            helperText="非空調室温度 - 空調室温度"
          />
        </Grid>

        <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            冬期温度差 [K]
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="温度差"
            value={formData.winter?.tempDiff || ''}
            onChange={(e) => handleNestedChange('winter', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
            helperText="非空調室温度 - 空調室温度"
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
