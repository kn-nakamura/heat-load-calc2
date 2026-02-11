// Window glass master data form

import { Box, TextField, Button, Typography, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { WindowGlassMaster } from '../../types';
import { useMasterDataStore, useUIStore } from '../../stores';
import { masterDataService } from '../../db';

interface WindowGlassFormProps {
  selectedId: string | null;
}

const glassTypes = [
  '単板ガラス',
  '複層ガラス',
  'Low-E複層ガラス',
  'トリプルガラス',
];

const blindTypes = [
  'なし',
  '明色ブラインド',
  '中間色ブラインド',
  '暗色ブラインド',
];

export const WindowGlassForm: React.FC<WindowGlassFormProps> = ({ selectedId }) => {
  const { windowGlass, updateWindowGlass, deleteWindowGlass } = useMasterDataStore();
  const { showSnackbar } = useUIStore();

  const selectedItem = windowGlass.find((item) => item.id === selectedId);

  const [formData, setFormData] = useState<Partial<WindowGlassMaster>>({
    name: '',
    glassType: '複層ガラス',
    glassCode: '',
    blindType: 'なし',
    shadingCoefficient: 0.88,
    uValue: 2.9,
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

  const handleSave = async () => {
    if (!selectedId || !formData.name) {
      showSnackbar('名前を入力してください', 'error');
      return;
    }

    try {
      updateWindowGlass(selectedId, formData);
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
      deleteWindowGlass(selectedId);
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
        <Typography variant="h6">窓ガラス</Typography>
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
            select
            label="ガラス種類"
            value={formData.glassType || ''}
            onChange={(e) => handleChange('glassType', e.target.value)}
          >
            {glassTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="ガラスコード"
            value={formData.glassCode || ''}
            onChange={(e) => handleChange('glassCode', e.target.value)}
            helperText="例: 2FA06, 3FA12など"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            select
            label="ブラインド種類"
            value={formData.blindType || ''}
            onChange={(e) => handleChange('blindType', e.target.value)}
          >
            {blindTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="遮蔽係数"
            value={formData.shadingCoefficient || ''}
            onChange={(e) => handleChange('shadingCoefficient', parseFloat(e.target.value))}
            inputProps={{ step: 0.01, min: 0, max: 1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="熱貫流率 [W/(m²·K)]"
            value={formData.uValue || ''}
            onChange={(e) => handleChange('uValue', parseFloat(e.target.value))}
            inputProps={{ step: 0.1, min: 0 }}
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
