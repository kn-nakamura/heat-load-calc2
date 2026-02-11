// Construction layer table component for envelope masters

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Paper,
  Box,
  Button,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ConstructionLayer, MaterialMaster } from '../../types';

interface ConstructionLayerTableProps {
  layers: ConstructionLayer[];
  materials: MaterialMaster[];
  onChange: (layers: ConstructionLayer[]) => void;
  onCalculate?: () => void;
}

export const ConstructionLayerTable: React.FC<ConstructionLayerTableProps> = ({
  layers,
  materials,
  onChange,
  onCalculate,
}) => {
  const handleAddLayer = () => {
    const newLayer: ConstructionLayer = {
      layerNumber: layers.length + 1,
      materialId: null,
      materialName: '',
      thickness: null,
      thermalConductivity: null,
      thermalResistance: null,
    };
    onChange([...layers, newLayer]);
  };

  const handleDeleteLayer = (layerNumber: number) => {
    const updatedLayers = layers
      .filter((layer) => layer.layerNumber !== layerNumber)
      .map((layer, index) => ({
        ...layer,
        layerNumber: index + 1,
      }));
    onChange(updatedLayers);
  };

  const handleLayerChange = (layerNumber: number, field: keyof ConstructionLayer, value: any) => {
    const updatedLayers = layers.map((layer) => {
      if (layer.layerNumber === layerNumber) {
        const updated = { ...layer, [field]: value };

        // If material is selected, populate conductivity/resistance
        if (field === 'materialId' && value) {
          const material = materials.find((m) => m.id === value);
          if (material) {
            updated.materialName = material.name;
            updated.thermalConductivity = material.thermalConductivity;
            updated.thermalResistance = material.thermalResistance;
          }
        }

        // Auto-calculate resistance from conductivity and thickness
        if ((field === 'thermalConductivity' || field === 'thickness') && updated.thickness && updated.thermalConductivity) {
          updated.thermalResistance = updated.thickness / 1000 / updated.thermalConductivity;
        }

        // Auto-calculate conductivity from resistance and thickness
        if (field === 'thermalResistance' && updated.thickness && updated.thermalResistance) {
          updated.thermalConductivity = updated.thickness / 1000 / updated.thermalResistance;
        }

        return updated;
      }
      return layer;
    });
    onChange(updatedLayers);
  };

  const totalResistance = layers.reduce((sum, layer) => sum + (layer.thermalResistance || 0), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">構成層</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={handleAddLayer}>
            層追加
          </Button>
          {onCalculate && (
            <Button size="small" variant="contained" onClick={onCalculate}>
              熱抵抗計算
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="50">No.</TableCell>
              <TableCell width="200">材料</TableCell>
              <TableCell width="150">材料名</TableCell>
              <TableCell width="120">厚さ [mm]</TableCell>
              <TableCell width="150">熱伝導率 [W/(m·K)]</TableCell>
              <TableCell width="150">熱抵抗 [m²·K/W]</TableCell>
              <TableCell width="60">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {layers.map((layer) => (
              <TableRow key={layer.layerNumber}>
                <TableCell>{layer.layerNumber}</TableCell>
                <TableCell>
                  <Select
                    size="small"
                    fullWidth
                    value={layer.materialId || ''}
                    onChange={(e) => handleLayerChange(layer.layerNumber, 'materialId', e.target.value || null)}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>選択してください</em>
                    </MenuItem>
                    {materials.map((material) => (
                      <MenuItem key={material.id} value={material.id}>
                        {material.name}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={layer.materialName || ''}
                    onChange={(e) => handleLayerChange(layer.layerNumber, 'materialName', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    value={layer.thickness || ''}
                    onChange={(e) => handleLayerChange(layer.layerNumber, 'thickness', parseFloat(e.target.value) || null)}
                    inputProps={{ step: 1 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    value={layer.thermalConductivity || ''}
                    onChange={(e) =>
                      handleLayerChange(layer.layerNumber, 'thermalConductivity', parseFloat(e.target.value) || null)
                    }
                    inputProps={{ step: 0.001 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    value={layer.thermalResistance || ''}
                    onChange={(e) => handleLayerChange(layer.layerNumber, 'thermalResistance', parseFloat(e.target.value) || null)}
                    inputProps={{ step: 0.001 }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleDeleteLayer(layer.layerNumber)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {layers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    層が登録されていません。「層追加」ボタンで追加してください。
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Typography variant="body2">
          <strong>合計熱抵抗:</strong> {totalResistance.toFixed(4)} m²·K/W
        </Typography>
      </Box>
    </Box>
  );
};
