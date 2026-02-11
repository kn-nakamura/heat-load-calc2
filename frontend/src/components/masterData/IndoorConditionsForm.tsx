// Indoor conditions master data form

import { Box, TextField, Button, Typography, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { IndoorConditionMaster } from '../../types';
import { useMasterDataStore, useUIStore } from '../../stores';
import { masterDataService } from '../../db';

interface IndoorConditionsFormProps {
  selectedId: string | null;
}

export const IndoorConditionsForm: React.FC<IndoorConditionsFormProps> = ({ selectedId }) => {
  const { indoorConditions, updateIndoorCondition, deleteIndoorCondition } = useMasterDataStore();
  const { showSnackbar } = useUIStore();

  const selectedItem = indoorConditions.find((item) => item.id === selectedId);

  const [formData, setFormData] = useState<Partial<IndoorConditionMaster>>({
    name: '',
    summer: {
      dryBulbTemp: 26,
      relativeHumidity: 50,
      absoluteHumidity: 0,
      enthalpy: 0,
      wetBulbTemp: 0,
    },
    winter: {
      dryBulbTemp: 22,
      relativeHumidity: 40,
      absoluteHumidity: 0,
      enthalpy: 0,
      wetBulbTemp: 0,
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
    setFormData((prev) => ({
      ...prev,
      [season]: {
        ...prev[season]!,
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
      updateIndoorCondition(selectedId, formData);
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
      deleteIndoorCondition(selectedId);
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
        <Typography variant="h6">設計用屋内条件</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            削除
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            保存
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Basic info */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="名称"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </Grid>

        {/* Summer conditions */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" gutterBottom>
            夏期条件
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="乾球温度 [°C]"
            value={formData.summer?.dryBulbTemp || ''}
            onChange={(e) => handleNestedChange('summer', 'dryBulbTemp', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="相対湿度 [%]"
            value={formData.summer?.relativeHumidity || ''}
            onChange={(e) => handleNestedChange('summer', 'relativeHumidity', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="絶対湿度 [kg/kg(DA)]"
            value={formData.summer?.absoluteHumidity || ''}
            onChange={(e) => handleNestedChange('summer', 'absoluteHumidity', parseFloat(e.target.value))}
            inputProps={{ step: 0.0001 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="エンタルピー [kJ/kg(DA)]"
            value={formData.summer?.enthalpy || ''}
            onChange={(e) => handleNestedChange('summer', 'enthalpy', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="湿球温度 [°C]"
            value={formData.summer?.wetBulbTemp || ''}
            onChange={(e) => handleNestedChange('summer', 'wetBulbTemp', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        {/* Winter conditions */}
        <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            冬期条件
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="乾球温度 [°C]"
            value={formData.winter?.dryBulbTemp || ''}
            onChange={(e) => handleNestedChange('winter', 'dryBulbTemp', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="相対湿度 [%]"
            value={formData.winter?.relativeHumidity || ''}
            onChange={(e) => handleNestedChange('winter', 'relativeHumidity', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="絶対湿度 [kg/kg(DA)]"
            value={formData.winter?.absoluteHumidity || ''}
            onChange={(e) => handleNestedChange('winter', 'absoluteHumidity', parseFloat(e.target.value))}
            inputProps={{ step: 0.0001 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="エンタルピー [kJ/kg(DA)]"
            value={formData.winter?.enthalpy || ''}
            onChange={(e) => handleNestedChange('winter', 'enthalpy', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="湿球温度 [°C]"
            value={formData.winter?.wetBulbTemp || ''}
            onChange={(e) => handleNestedChange('winter', 'wetBulbTemp', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        {/* Remarks */}
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
