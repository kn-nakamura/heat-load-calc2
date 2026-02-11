// Room basic properties form

import { Box, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Room } from '../../types';

interface RoomBasicFormProps {
  formData: Partial<Room>;
  onChange: (field: string, value: any) => void;
}

export const RoomBasicForm: React.FC<RoomBasicFormProps> = ({ formData, onChange }) => {
  const safeEvaluate = (formula: string): number | null => {
    try {
      // Only allow numbers, operators, parentheses, and decimal points
      const sanitized = formula.replace(/[^0-9+\-*/().]/g, '');
      if (!sanitized) return null;

      // Use Function constructor instead of eval (safer)
      const fn = new Function(`return ${sanitized}`);
      const result = fn();

      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return result;
      }
    } catch (e) {
      // Invalid formula
    }
    return null;
  };

  const handleFloorAreaFormulaChange = (value: string) => {
    onChange('floorAreaFormula', value);

    const result = safeEvaluate(value);
    if (result !== null) {
      onChange('floorArea', parseFloat(result.toFixed(2)));

      // Recalculate room volume
      if (formData.ceilingHeight) {
        onChange('roomVolume', parseFloat((result * formData.ceilingHeight).toFixed(2)));
      }
    }
  };

  const handleCeilingHeightChange = (value: number) => {
    onChange('ceilingHeight', value);

    // Recalculate room volume
    if (formData.floorArea) {
      onChange('roomVolume', parseFloat((formData.floorArea * value).toFixed(2)));
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        基本情報
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="階"
            value={formData.floor || ''}
            onChange={(e) => onChange('floor', e.target.value)}
            placeholder="1F"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="室番号"
            value={formData.roomNumber || ''}
            onChange={(e) => onChange('roomNumber', e.target.value)}
            placeholder="101"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="室名"
            value={formData.roomName || ''}
            onChange={(e) => onChange('roomName', e.target.value)}
            placeholder="会議室"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="床面積算式"
            value={formData.floorAreaFormula || ''}
            onChange={(e) => handleFloorAreaFormulaChange(e.target.value)}
            placeholder="10*8"
            helperText="例: 10*8, 12.5*6.4"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="床面積 [m²]"
            value={formData.floorArea || ''}
            InputProps={{ readOnly: true }}
            helperText="算式から自動計算"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="階高 [m]"
            value={formData.floorHeight || ''}
            onChange={(e) => onChange('floorHeight', parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="天井高 [m]"
            value={formData.ceilingHeight || ''}
            onChange={(e) => handleCeilingHeightChange(parseFloat(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="室数"
            value={formData.roomCount || ''}
            onChange={(e) => onChange('roomCount', parseInt(e.target.value))}
            inputProps={{ step: 1, min: 1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="室容積 [m³]"
            value={formData.roomVolume || ''}
            InputProps={{ readOnly: true }}
            helperText="床面積 × 天井高"
          />
        </Grid>
      </Grid>
    </Box>
  );
};
