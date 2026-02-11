// Room calculation conditions form

import { Box, TextField, Typography, Divider, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid';
import { RoomCalculationConditions } from '../../types';

interface RoomCalculationConditionsFormProps {
  formData: RoomCalculationConditions;
  floorArea: number;
  roomVolume: number;
  onChange: (field: keyof RoomCalculationConditions, value: any) => void;
}

const infiltrationMethods = ['建築基準法', 'SHASE-S', '実測値'];
const windowTypes = ['アルミサッシ', '木製サッシ', '樹脂サッシ'];
const airtightnessLevels = ['高気密', '中気密', '低気密'];

export const RoomCalculationConditionsForm: React.FC<RoomCalculationConditionsFormProps> = ({
  formData,
  floorArea,
  roomVolume,
  onChange,
}) => {
  const handleOutdoorAirVolumeChange = (value: number | null) => {
    onChange('outdoorAirVolume', value);

    if (value !== null) {
      // Calculate per area
      if (floorArea > 0) {
        onChange('outdoorAirVolumePerArea', parseFloat((value / floorArea).toFixed(2)));
      }

      // Calculate ventilation count
      if (roomVolume > 0) {
        onChange('ventilationCount', parseFloat((value / roomVolume).toFixed(2)));
      }
    }
  };

  const handleOccupancyDensityChange = (value: number | null) => {
    onChange('occupancyDensity', value);

    if (value !== null && floorArea > 0) {
      onChange('occupancyCount', parseFloat((value * floorArea).toFixed(1)));
    }
  };

  return (
    <Box>
      {/* Outdoor Air / Ventilation */}
      <Typography variant="subtitle1" gutterBottom>
        外気量・換気
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="外気量 [m³/h]"
            value={formData.outdoorAirVolume || ''}
            onChange={(e) => handleOutdoorAirVolumeChange(parseFloat(e.target.value) || null)}
            inputProps={{ step: 10 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="外気量/床面積 [m³/(h·m²)]"
            value={formData.outdoorAirVolumePerArea || ''}
            InputProps={{ readOnly: true }}
            helperText="自動計算"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="外気量/人 [m³/(h·人)]"
            value={formData.outdoorAirVolumePerPerson || ''}
            onChange={(e) => onChange('outdoorAirVolumePerPerson', parseFloat(e.target.value) || null)}
            inputProps={{ step: 1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="換気回数 [回/h]"
            value={formData.ventilationCount || ''}
            InputProps={{ readOnly: true }}
            helperText="自動計算"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Infiltration */}
      <Typography variant="subtitle1" gutterBottom>
        すきま風・隙間
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>すきま風算定方法</InputLabel>
            <Select
              value={formData.infiltrationMethod || ''}
              label="すきま風算定方法"
              onChange={(e) => onChange('infiltrationMethod', e.target.value || null)}
            >
              <MenuItem value="">-</MenuItem>
              {infiltrationMethods.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="隙間相当面積 [cm²]"
            value={formData.infiltrationArea || ''}
            onChange={(e) => onChange('infiltrationArea', parseFloat(e.target.value) || null)}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth>
            <InputLabel>サッシ種類</InputLabel>
            <Select
              value={formData.windowType || ''}
              label="サッシ種類"
              onChange={(e) => onChange('windowType', e.target.value || null)}
            >
              <MenuItem value="">-</MenuItem>
              {windowTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth>
            <InputLabel>気密性</InputLabel>
            <Select
              value={formData.airtightness || ''}
              label="気密性"
              onChange={(e) => onChange('airtightness', e.target.value || null)}
            >
              <MenuItem value="">-</MenuItem>
              {airtightnessLevels.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="風速 [m/s]"
            value={formData.windSpeed || ''}
            onChange={(e) => onChange('windSpeed', parseFloat(e.target.value) || null)}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="すきま風量 [m³/h]"
            value={formData.infiltrationVolume || ''}
            onChange={(e) => onChange('infiltrationVolume', parseFloat(e.target.value) || null)}
            inputProps={{ step: 10 }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Occupancy */}
      <Typography variant="subtitle1" gutterBottom>
        在室人数
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="在室密度 [人/m²]"
            value={formData.occupancyDensity || ''}
            onChange={(e) => handleOccupancyDensityChange(parseFloat(e.target.value) || null)}
            inputProps={{ step: 0.01 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="在室人数 [人]"
            value={formData.occupancyCount || ''}
            InputProps={{ readOnly: true }}
            helperText="在室密度 × 床面積"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Other Loads */}
      <Typography variant="subtitle1" gutterBottom>
        その他負荷
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="その他顕熱 [W]"
            value={formData.otherSensibleLoad || ''}
            onChange={(e) => onChange('otherSensibleLoad', parseFloat(e.target.value) || null)}
            inputProps={{ step: 10 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="その他潜熱 [W]"
            value={formData.otherLatentLoad || ''}
            onChange={(e) => onChange('otherLatentLoad', parseFloat(e.target.value) || null)}
            inputProps={{ step: 10 }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
