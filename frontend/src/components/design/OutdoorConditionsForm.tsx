// Outdoor design conditions form component

import { Box, TextField, Typography, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { DesignConditions } from '../../types';

interface OutdoorConditionsFormProps {
  formData: DesignConditions;
  onChange: (field: keyof DesignConditions, value: any) => void;
}

export const OutdoorConditionsForm: React.FC<OutdoorConditionsFormProps> = ({ formData, onChange }) => {
  const handleNestedChange = (season: 'outdoorSummer' | 'outdoorWinter', field: string, value: number) => {
    onChange(season, {
      ...formData[season],
      [field]: value,
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        外気設計条件
      </Typography>

      {/* Summer conditions */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
        夏期
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="乾球温度 [°C]"
            value={formData.outdoorSummer.dryBulbTemp || ''}
            onChange={(e) => handleNestedChange('outdoorSummer', 'dryBulbTemp', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="相対湿度 [%]"
            value={formData.outdoorSummer.relativeHumidity || ''}
            onChange={(e) => handleNestedChange('outdoorSummer', 'relativeHumidity', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="湿球温度 [°C]"
            value={formData.outdoorSummer.wetBulbTemp || ''}
            onChange={(e) => handleNestedChange('outdoorSummer', 'wetBulbTemp', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="絶対湿度 [kg/kg(DA)]"
            value={formData.outdoorSummer.absoluteHumidity || ''}
            onChange={(e) => handleNestedChange('outdoorSummer', 'absoluteHumidity', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 0.0001 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="エンタルピー [kJ/kg(DA)]"
            value={formData.outdoorSummer.enthalpy || ''}
            onChange={(e) => handleNestedChange('outdoorSummer', 'enthalpy', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 0.1 }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Winter conditions */}
      <Typography variant="subtitle1" gutterBottom>
        冬期
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="乾球温度 [°C]"
            value={formData.outdoorWinter.dryBulbTemp || ''}
            onChange={(e) => handleNestedChange('outdoorWinter', 'dryBulbTemp', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="相対湿度 [%]"
            value={formData.outdoorWinter.relativeHumidity || ''}
            onChange={(e) => handleNestedChange('outdoorWinter', 'relativeHumidity', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="湿球温度 [°C]"
            value={formData.outdoorWinter.wetBulbTemp || ''}
            onChange={(e) => handleNestedChange('outdoorWinter', 'wetBulbTemp', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="絶対湿度 [kg/kg(DA)]"
            value={formData.outdoorWinter.absoluteHumidity || ''}
            onChange={(e) => handleNestedChange('outdoorWinter', 'absoluteHumidity', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 0.0001 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="エンタルピー [kJ/kg(DA)]"
            value={formData.outdoorWinter.enthalpy || ''}
            onChange={(e) => handleNestedChange('outdoorWinter', 'enthalpy', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 0.1 }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
