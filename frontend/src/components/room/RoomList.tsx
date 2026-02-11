// Room list component

import { Box, List, ListItemButton, ListItemText, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { RoomListItem } from '../../types';

interface RoomListProps {
  rooms: RoomListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export const RoomList: React.FC<RoomListProps> = ({ rooms, selectedId, onSelect, onAdd }) => {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRight: 1, borderColor: 'divider' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2">室一覧</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={onAdd}>
          追加
        </Button>
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        {rooms.map((room) => (
          <ListItemButton
            key={room.id}
            selected={selectedId === room.id}
            onClick={() => onSelect(room.id)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <ListItemText
              primary={`${room.floor} ${room.roomNumber} ${room.roomName}`}
              secondary={
                <>
                  <Typography component="span" variant="body2" color="text.secondary">
                    {room.floorArea.toFixed(1)}m²
                  </Typography>
                  {room.systemName && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      系統: {room.systemName}
                    </Typography>
                  )}
                </>
              }
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};
