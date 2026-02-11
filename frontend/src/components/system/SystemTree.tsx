// System tree component with hierarchical display

import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { SystemTreeNode } from '../../types';

interface SystemTreeProps {
  nodes: SystemTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onDelete: (id: string) => void;
}

export const SystemTree: React.FC<SystemTreeProps> = ({
  nodes,
  selectedId,
  onSelect,
  onAddChild,
  onDelete,
}) => {
  const renderTree = (nodes: SystemTreeNode[]) => {
    return nodes.map((node) => (
      <TreeItem
        key={node.id}
        itemId={node.id}
        label={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 0.5,
              pr: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{node.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                ({node.roomCount}室 / 計{node.totalRoomCount}室)
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="子系統追加">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddChild(node.id);
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="削除">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(node.id);
                  }}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        }
      >
        {node.children && node.children.length > 0 && renderTree(node.children)}
      </TreeItem>
    ));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2">系統ツリー</Typography>
        <IconButton size="small" onClick={() => onAddChild(null)}>
          <AddIcon />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
        {nodes.length > 0 ? (
          <SimpleTreeView
            slots={{
              collapseIcon: ExpandMoreIcon,
              expandIcon: ChevronRightIcon,
            }}
            selectedItems={selectedId || undefined}
            onSelectedItemsChange={(_event: React.SyntheticEvent | null, itemId: string | null) => {
              if (itemId) {
                onSelect(itemId);
              }
            }}
            sx={{
              '& .MuiTreeItem-content': {
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'action.selected',
                },
              },
            }}
          >
            {renderTree(nodes)}
          </SimpleTreeView>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              系統を追加してください
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
