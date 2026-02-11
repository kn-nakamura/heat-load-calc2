// System form component

import { Box, TextField, Typography, Button, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { System } from '../../types';
import { useSystemStore, useRoomStore } from '../../stores';

interface SystemFormProps {
  selectedId: string | null;
  formData: Partial<System>;
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  onDelete: () => void;
}

export const SystemForm: React.FC<SystemFormProps> = ({
  selectedId,
  formData,
  onChange,
  onSave,
  onDelete,
}) => {
  const { systems } = useSystemStore();
  const { rooms } = useRoomStore();

  // Get available parent systems (excluding self and descendants)
  const getAvailableParents = () => {
    if (!selectedId) {
      return systems.filter((s) => s.id !== formData.id);
    }

    // Exclude self and all descendants
    const excludeIds = new Set<string>([selectedId]);
    const addDescendants = (parentId: string) => {
      systems
        .filter((s) => s.parentId === parentId)
        .forEach((s) => {
          excludeIds.add(s.id);
          addDescendants(s.id);
        });
    };
    addDescendants(selectedId);

    return systems.filter((s) => !excludeIds.has(s.id));
  };

  const availableParents = getAvailableParents();

  // Get rooms assigned to this system
  const assignedRooms = rooms.filter((r) => formData.roomIds?.includes(r.id));

  if (!selectedId) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          左のツリーから系統を選択するか、新規追加してください
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">系統編集</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={onDelete}>
            削除
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave}>
            保存
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="系統名"
            value={formData.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="例: 1階空調系統"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <FormControl fullWidth>
            <InputLabel>親系統</InputLabel>
            <Select
              value={formData.parentId || ''}
              label="親系統"
              onChange={(e) => onChange('parentId', e.target.value || null)}
            >
              <MenuItem value="">（なし - ルート系統）</MenuItem>
              {availableParents.map((system) => (
                <MenuItem key={system.id} value={system.id}>
                  {system.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            type="number"
            label="表示順序"
            value={formData.order || 0}
            onChange={(e) => onChange('order', parseInt(e.target.value) || 0)}
            inputProps={{ step: 1 }}
            helperText="同じ階層内での表示順序（昇順）"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" gutterBottom>
            割り当て室 ({assignedRooms.length}室)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {assignedRooms.length > 0 ? (
              assignedRooms.map((room) => (
                <Chip
                  key={room.id}
                  label={`${room.floor} ${room.roomNumber} ${room.roomName}`}
                  size="small"
                  variant="outlined"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                室が割り当てられていません（室登録ページで割り当てできます）
              </Typography>
            )}
          </Box>
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
