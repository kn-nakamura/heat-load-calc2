// Room system and notes form

import { Box, TextField, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid';
import { RoomSystemNotes } from '../../types';
import { useSystemStore } from '../../stores';

interface RoomSystemNotesFormProps {
  formData: RoomSystemNotes;
  onChange: (field: keyof RoomSystemNotes, value: any) => void;
}

export const RoomSystemNotesForm: React.FC<RoomSystemNotesFormProps> = ({ formData, onChange }) => {
  const { systems } = useSystemStore();

  // Flatten system tree to list for selection
  const flattenSystems = (nodes: any[]): any[] => {
    const result: any[] = [];
    const traverse = (nodes: any[], level: number = 0) => {
      nodes.forEach((node) => {
        result.push({ ...node, level });
        if (node.children && node.children.length > 0) {
          traverse(node.children, level + 1);
        }
      });
    };
    traverse(nodes);
    return result;
  };

  const flatSystems = flattenSystems(systems);

  const handleSystemChange = (systemId: string | null) => {
    onChange('systemId', systemId);

    if (systemId) {
      const system = flatSystems.find((s) => s.id === systemId);
      onChange('systemName', system?.name || null);
    } else {
      onChange('systemName', null);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        系統・備考
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <FormControl fullWidth>
            <InputLabel>系統</InputLabel>
            <Select
              value={formData.systemId || ''}
              label="系統"
              onChange={(e) => handleSystemChange(e.target.value || null)}
            >
              <MenuItem value="">-</MenuItem>
              {flatSystems.map((system) => (
                <MenuItem key={system.id} value={system.id}>
                  {'　'.repeat(system.level)}{system.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="備考"
            value={formData.notes || ''}
            onChange={(e) => onChange('notes', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
