// Calculation settings form component

import { Box, TextField, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid';
import { DesignConditions } from '../../types';

interface CalculationSettingsFormProps {
  formData: DesignConditions;
  onChange: (field: keyof DesignConditions, value: any) => void;
}

const calculationMethods = ['最大負荷法', '熱負荷計算法', 'PAL*計算'];
const unitSystems = ['SI', 'MKS'];

export const CalculationSettingsForm: React.FC<CalculationSettingsFormProps> = ({ formData, onChange }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        計算設定
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>計算方法</InputLabel>
            <Select
              value={formData.calculationMethod || '最大負荷法'}
              label="計算方法"
              onChange={(e) => onChange('calculationMethod', e.target.value)}
            >
              {calculationMethods.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>単位系</InputLabel>
            <Select
              value={formData.unitSystem || 'SI'}
              label="単位系"
              onChange={(e) => onChange('unitSystem', e.target.value)}
            >
              {unitSystems.map((system) => (
                <MenuItem key={system} value={system}>
                  {system}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};
