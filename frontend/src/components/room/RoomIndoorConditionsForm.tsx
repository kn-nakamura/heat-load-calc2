// Room indoor conditions form

import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid';
import { RoomIndoorConditions } from '../../types';
import { useMasterDataStore } from '../../stores';

interface RoomIndoorConditionsFormProps {
  formData: RoomIndoorConditions;
  onChange: (field: keyof RoomIndoorConditions, value: any) => void;
}

const lightingTypes = [
  '蛍光灯ダウンライト',
  '蛍光灯ルーバ',
  'LEDダウンライト',
  'LEDルーバ',
  '白熱灯',
];

export const RoomIndoorConditionsForm: React.FC<RoomIndoorConditionsFormProps> = ({ formData, onChange }) => {
  const { indoorConditions, lightingPower, occupancyHeat, equipmentPower } = useMasterDataStore();

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
    </Box>
  );
};
