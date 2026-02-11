// Overhang master data form

import { Box, TextField, Button, Typography, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { OverhangMaster } from '../../types';
import { useMasterDataStore, useUIStore } from '../../stores';
import { masterDataService } from '../../db';

interface OverhangFormProps {
  selectedId: string | null;
}

export const OverhangForm: React.FC<OverhangFormProps> = ({ selectedId }) => {
  const { overhangs, updateOverhang, deleteOverhang } = useMasterDataStore();
  const { showSnackbar } = useUIStore();

  const selectedItem = overhangs.find((item) => item.id === selectedId);

  const [formData, setFormData] = useState<Partial<OverhangMaster>>({
    name: '',
    overhangDepth: 0,
    windowHeight: 0,
    overhangHeight: 0,
    shadingFactor: 1.0,
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

  const calculateShadingFactor = () => {
    const { overhangDepth, windowHeight, overhangHeight } = formData;

    // Simple shading factor calculation based on geometry
    // shadingFactor = ratio of unshaded window area
    // This is a simplified calculation - real calculation would consider sun angles
    if (overhangDepth && windowHeight && overhangHeight) {
      const ratio = overhangDepth / (windowHeight + overhangHeight);
      const shadingFactor = Math.max(0, Math.min(1, 1 - ratio * 0.5));

      setFormData((prev) => ({
        ...prev,
        shadingFactor: parseFloat(shadingFactor.toFixed(3)),
      }));

      showSnackbar('遮蔽係数を計算しました', 'info');
    } else {
      showSnackbar('すべての寸法を入力してください', 'warning');
    }
  };

  const handleSave = async () => {
    if (!selectedId || !formData.name) {
      showSnackbar('名前を入力してください', 'error');
      return;
    }

    try {
      updateOverhang(selectedId, formData);
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
      deleteOverhang(selectedId);
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
        <Typography variant="h6">ひさし</Typography>
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
            寸法
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="ひさし出寸法 [m]"
            value={formData.overhangDepth || ''}
            onChange={(e) => handleChange('overhangDepth', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="窓高さ [m]"
            value={formData.windowHeight || ''}
            onChange={(e) => handleChange('windowHeight', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="ひさし高さ [m]"
            value={formData.overhangHeight || ''}
            onChange={(e) => handleChange('overhangHeight', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" onClick={calculateShadingFactor}>
              遮蔽係数計算
            </Button>
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" gutterBottom>
            計算結果
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="遮蔽係数"
            value={formData.shadingFactor || ''}
            InputProps={{ readOnly: true }}
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
