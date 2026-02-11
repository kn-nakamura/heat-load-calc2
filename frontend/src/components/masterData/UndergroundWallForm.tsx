// Underground wall master data form

import { Box, TextField, Button, Typography, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { UndergroundWallMaster } from '../../types';
import { useMasterDataStore, useUIStore } from '../../stores';
import { masterDataService } from '../../db';
import { ConstructionLayerTable } from './ConstructionLayerTable';

interface UndergroundWallFormProps {
  selectedId: string | null;
}

export const UndergroundWallForm: React.FC<UndergroundWallFormProps> = ({ selectedId }) => {
  const { undergroundWalls, materials, updateUndergroundWall, deleteUndergroundWall } = useMasterDataStore();
  const { showSnackbar } = useUIStore();

  const selectedItem = undergroundWalls.find((item) => item.id === selectedId);

  const [formData, setFormData] = useState<Partial<UndergroundWallMaster>>({
    name: '',
    wallType: '地中壁',
    layers: [],
    interiorSurfaceResistance: 0.11,
    totalResistance: 0,
    uValue: 0,
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

  const calculateThermalProperties = () => {
    const layersResistance = formData.layers?.reduce((sum, layer) => sum + (layer.thermalResistance || 0), 0) || 0;

    // Underground wall: only interior surface resistance (no exterior)
    const totalResistance = (formData.interiorSurfaceResistance || 0) + layersResistance;

    setFormData((prev) => ({
      ...prev,
      totalResistance: totalResistance,
      uValue: totalResistance > 0 ? 1 / totalResistance : 0,
    }));

    showSnackbar('熱抵抗を計算しました', 'info');
  };

  const handleSave = async () => {
    if (!selectedId || !formData.name) {
      showSnackbar('名前を入力してください', 'error');
      return;
    }

    try {
      updateUndergroundWall(selectedId, formData);
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
      deleteUndergroundWall(selectedId);
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
        <Typography variant="h6">地中壁</Typography>
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
            label="壁種類"
            value={formData.wallType || ''}
            onChange={(e) => handleChange('wallType', e.target.value)}
          />
        </Grid>

        {/* Construction layers */}
        <Grid size={{ xs: 12 }}>
          <ConstructionLayerTable
            layers={formData.layers || []}
            materials={materials}
            onChange={(layers) => handleChange('layers', layers)}
            onCalculate={calculateThermalProperties}
          />
        </Grid>

        {/* Surface resistance */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" gutterBottom>
            表面熱伝達抵抗
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="室内側 [m²·K/W]"
            value={formData.interiorSurfaceResistance || ''}
            onChange={(e) => handleChange('interiorSurfaceResistance', parseFloat(e.target.value))}
            inputProps={{ step: 0.01 }}
          />
        </Grid>

        {/* Calculated properties */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" gutterBottom>
            計算結果（自動計算）
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="総熱抵抗 [m²·K/W]"
            value={formData.totalResistance || ''}
            InputProps={{ readOnly: true }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="熱貫流率 [W/(m²·K)]"
            value={formData.uValue || ''}
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
