// Building information form component

import { Box, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { DesignConditions } from '../../types';

interface BuildingInfoFormProps {
  formData: DesignConditions;
  onChange: (field: keyof DesignConditions, value: any) => void;
}

export const BuildingInfoForm: React.FC<BuildingInfoFormProps> = ({ formData, onChange }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        建物情報
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="建物名称"
            value={formData.buildingName || ''}
            onChange={(e) => onChange('buildingName', e.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="建物所在地"
            value={formData.buildingLocation || ''}
            onChange={(e) => onChange('buildingLocation', e.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="建物用途"
            value={formData.buildingUsage || ''}
            onChange={(e) => onChange('buildingUsage', e.target.value)}
            placeholder="例: 事務所、学校、病院"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="建物構造"
            value={formData.buildingStructure || ''}
            onChange={(e) => onChange('buildingStructure', e.target.value)}
            placeholder="例: RC造、S造、SRC造"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="延床面積 [m²]"
            value={formData.totalFloorArea || ''}
            onChange={(e) => onChange('totalFloorArea', parseFloat(e.target.value) || null)}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="地上階数"
            value={formData.floorsAbove || ''}
            onChange={(e) => onChange('floorsAbove', parseInt(e.target.value) || null)}
            inputProps={{ step: 1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="地下階数"
            value={formData.floorsBelow || ''}
            onChange={(e) => onChange('floorsBelow', parseInt(e.target.value) || null)}
            inputProps={{ step: 1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="作成者"
            value={formData.reportAuthor || ''}
            onChange={(e) => onChange('reportAuthor', e.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="備考"
            value={formData.remarks || ''}
            onChange={(e) => onChange('remarks', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
