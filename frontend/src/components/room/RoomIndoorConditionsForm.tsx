// Room indoor conditions form

import { Box, Typography, FormControl, InputLabel, Select, MenuItem, TextField, Alert } from '@mui/material';
import Grid from '@mui/material/Grid';
import { RoomIndoorConditions } from '../../types';
import { useMasterDataStore } from '../../stores';

interface RoomIndoorConditionsFormProps {
  formData: RoomIndoorConditions;
  onChange: (field: keyof RoomIndoorConditions, value: any) => void;
  floorArea?: number; // Room floor area for calculations
  occupancyDensity?: number; // Occupancy density [person/m²]
}

const lightingTypes = [
  '蛍光灯ダウンライト',
  '蛍光灯ルーバ',
  'LEDダウンライト',
  'LEDルーバ',
  '白熱灯',
];

export const RoomIndoorConditionsForm: React.FC<RoomIndoorConditionsFormProps> = ({
  formData,
  onChange,
  floorArea = 0,
  occupancyDensity = 0
}) => {
  const { indoorConditions, lightingPower, occupancyHeat, equipmentPower } = useMasterDataStore();

  // Get selected master data items
  const selectedLighting = lightingPower.find((item) => item.id === formData.lightingCode);
  const selectedOccupancy = occupancyHeat.find((item) => item.id === formData.occupancyCode);
  const selectedEquipment = equipmentPower.find((item) => item.id === formData.equipmentCode);

  // Calculate values based on lighting type
  const getLightingPowerDensity = (): number => {
    if (!selectedLighting || !formData.lightingType) return 0;

    const typeMap: { [key: string]: keyof typeof selectedLighting.powerDensity } = {
      '蛍光灯ダウンライト': 'fluorescentDownlight',
      '蛍光灯ルーバ': 'fluorescentLouver',
      'LEDダウンライト': 'ledDownlight',
      'LEDルーバ': 'ledLouver',
    };

    const key = typeMap[formData.lightingType];
    return key ? selectedLighting.powerDensity[key] : 0;
  };

  const lightingPowerDensity = getLightingPowerDensity();
  const lightingLoad = lightingPowerDensity * floorArea; // W

  const occupancyCount = occupancyDensity * floorArea; // persons
  const occupancySensibleLoad = selectedOccupancy ? selectedOccupancy.summer.sensibleHeat * occupancyCount : 0; // W
  const occupancyLatentLoad = selectedOccupancy ? selectedOccupancy.summer.latentHeat * occupancyCount : 0; // W

  const equipmentPowerDensity = selectedEquipment ? selectedEquipment.powerDensity : 0;
  const equipmentLoad = equipmentPowerDensity * floorArea; // W

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        室内条件
      </Typography>

      <Grid container spacing={2}>
        {/* Indoor Condition Code */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>室内条件コード</InputLabel>
            <Select
              value={formData.indoorConditionCode || ''}
              label="室内条件コード"
              onChange={(e) => onChange('indoorConditionCode', e.target.value || null)}
            >
              <MenuItem value="">-</MenuItem>
              {indoorConditions.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Lighting Code */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>照明コード</InputLabel>
            <Select
              value={formData.lightingCode || ''}
              label="照明コード"
              onChange={(e) => onChange('lightingCode', e.target.value || null)}
            >
              <MenuItem value="">-</MenuItem>
              {lightingPower.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Lighting Type */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>照明タイプ</InputLabel>
            <Select
              value={formData.lightingType || ''}
              label="照明タイプ"
              onChange={(e) => onChange('lightingType', e.target.value || null)}
            >
              <MenuItem value="">-</MenuItem>
              {lightingTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Occupancy Code */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>人体発熱コード</InputLabel>
            <Select
              value={formData.occupancyCode || ''}
              label="人体発熱コード"
              onChange={(e) => onChange('occupancyCode', e.target.value || null)}
            >
              <MenuItem value="">-</MenuItem>
              {occupancyHeat.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Equipment Code */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>機器コード</InputLabel>
            <Select
              value={formData.equipmentCode || ''}
              label="機器コード"
              onChange={(e) => onChange('equipmentCode', e.target.value || null)}
            >
              <MenuItem value="">-</MenuItem>
              {equipmentPower.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Calculated Values Section */}
      {floorArea > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            計算値（夏期）
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            室面積: {floorArea.toFixed(1)} m² | 在室人数: {occupancyCount.toFixed(1)} 人
          </Alert>
          <Grid container spacing={2}>
            {/* Lighting Load */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="照明負荷"
                value={lightingLoad.toFixed(0)}
                InputProps={{
                  readOnly: true,
                  endAdornment: <Typography variant="caption">W</Typography>,
                }}
                helperText={lightingPowerDensity > 0 ? `${lightingPowerDensity.toFixed(1)} W/m² × ${floorArea.toFixed(1)} m²` : '照明コードとタイプを選択してください'}
              />
            </Grid>

            {/* Occupancy Sensible Load */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="人体顕熱負荷"
                value={occupancySensibleLoad.toFixed(0)}
                InputProps={{
                  readOnly: true,
                  endAdornment: <Typography variant="caption">W</Typography>,
                }}
                helperText={
                  selectedOccupancy && occupancyCount > 0
                    ? `${selectedOccupancy.summer.sensibleHeat.toFixed(0)} W/人 × ${occupancyCount.toFixed(1)} 人`
                    : '人体発熱コードと在室密度を設定してください'
                }
              />
            </Grid>

            {/* Occupancy Latent Load */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="人体潜熱負荷"
                value={occupancyLatentLoad.toFixed(0)}
                InputProps={{
                  readOnly: true,
                  endAdornment: <Typography variant="caption">W</Typography>,
                }}
                helperText={
                  selectedOccupancy && occupancyCount > 0
                    ? `${selectedOccupancy.summer.latentHeat.toFixed(0)} W/人 × ${occupancyCount.toFixed(1)} 人`
                    : '人体発熱コードと在室密度を設定してください'
                }
              />
            </Grid>

            {/* Equipment Load */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="機器負荷"
                value={equipmentLoad.toFixed(0)}
                InputProps={{
                  readOnly: true,
                  endAdornment: <Typography variant="caption">W</Typography>,
                }}
                helperText={equipmentPowerDensity > 0 ? `${equipmentPowerDensity.toFixed(1)} W/m² × ${floorArea.toFixed(1)} m²` : '機器コードを選択してください'}
              />
            </Grid>

            {/* Total Internal Load */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="内部発熱合計（顕熱）"
                value={(lightingLoad + occupancySensibleLoad + equipmentLoad).toFixed(0)}
                InputProps={{
                  readOnly: true,
                  endAdornment: <Typography variant="caption">W</Typography>,
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    fontWeight: 'bold',
                    backgroundColor: 'action.hover',
                  },
                }}
              />
            </Grid>

            {/* Total Latent Load */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="内部発熱合計（潜熱）"
                value={occupancyLatentLoad.toFixed(0)}
                InputProps={{
                  readOnly: true,
                  endAdornment: <Typography variant="caption">W</Typography>,
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    fontWeight: 'bold',
                    backgroundColor: 'action.hover',
                  },
                }}
              />
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};
