// Reusable master data list component

import { List, ListItem, ListItemButton, ListItemText, Box, Button, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface MasterDataListProps<T extends { id: string; name: string }> {
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  title: string;
}

export function MasterDataList<T extends { id: string; name: string }>({
  items,
  selectedId,
  onSelect,
  onAdd,
  title,
}: MasterDataListProps<T>) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRight: 1, borderColor: 'divider' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
        >
          追加
        </Button>
      </Box>
      <List sx={{ flexGrow: 1, overflow: 'auto', py: 0 }}>
        {items.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={selectedId === item.id}
              onClick={() => onSelect(item.id)}
            >
              <ListItemText
                primary={item.name}
                primaryTypographyProps={{ fontSize: '0.875rem' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        {items.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              データがありません
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );
}
