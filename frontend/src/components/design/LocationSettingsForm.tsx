// Location settings form component

import { Box, TextField, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid';
import { DesignConditions } from '../../types';

interface LocationSettingsFormProps {
  formData: DesignConditions;
  onChange: (field: keyof DesignConditions, value: any) => void;
}

const regions = ['1地域', '2地域', '3地域', '4地域', '5地域', '6地域', '7地域', '8地域'];
const solarRegions = ['A1', 'A2', 'A3', 'A4', 'A5'];
const orientationBases = ['真北', '磁北'];

export const LocationSettingsForm: React.FC<LocationSettingsFormProps> = ({ formData, onChange }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        地域設定
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="地点名"
            value={formData.locationLabel || ''}
            onChange={(e) => onChange('locationLabel', e.target.value)}
            placeholder="例: 東京、大阪、札幌"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <FormControl fullWidth>
            <InputLabel>地域区分</InputLabel>
            <Select
              value={formData.region || '6地域'}
              label="地域区分"
              onChange={(e) => onChange('region', e.target.value)}
            >
              {regions.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <FormControl fullWidth>
            <InputLabel>日射地域区分</InputLabel>
            <Select
              value={formData.solarRegion || 'A3'}
              label="日射地域区分"
              onChange={(e) => onChange('solarRegion', e.target.value)}
            >
              {solarRegions.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="緯度 [°]"
            value={formData.latitude || ''}
            onChange={(e) => onChange('latitude', parseFloat(e.target.value) || null)}
            inputProps={{ step: 0.01 }}
            placeholder="北緯"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="経度 [°]"
            value={formData.longitude || ''}
            onChange={(e) => onChange('longitude', parseFloat(e.target.value) || null)}
            inputProps={{ step: 0.01 }}
            placeholder="東経"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>方位基準</InputLabel>
            <Select
              value={formData.orientationBasis || '真北'}
              label="方位基準"
              onChange={(e) => onChange('orientationBasis', e.target.value)}
            >
              {orientationBases.map((basis) => (
                <MenuItem key={basis} value={basis}>
                  {basis}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="方位角度 [°]"
            value={formData.orientationAngle || 0}
            onChange={(e) => onChange('orientationAngle', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 1 }}
            helperText="真北からの偏角"
          />
        </Grid>
      </Grid>
    </Box>
  );
};
