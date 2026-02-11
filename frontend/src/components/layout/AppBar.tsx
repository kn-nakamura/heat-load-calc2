// App bar component

import { AppBar as MuiAppBar, Toolbar, Typography, IconButton, Button } from '@mui/material';
import { Menu as MenuIcon, Save as SaveIcon } from '@mui/icons-material';
import { useUIStore, useProjectStore } from '../../stores';
import { appService } from '../../db';

const DRAWER_WIDTH = 240;

export const AppBar: React.FC = () => {
  const { toggleSidebar, showSnackbar, setLoading } = useUIStore();
  const { currentProject } = useProjectStore();

  const handleSave = async () => {
    try {
      setLoading(true);
      await appService.saveAll();
      showSnackbar('データを保存しました', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showSnackbar('保存に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MuiAppBar
      position="fixed"
      sx={{
        width: `calc(100% - ${DRAWER_WIDTH}px)`,
        ml: `${DRAWER_WIDTH}px`,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {currentProject?.name || '熱負荷計算システム'}
        </Typography>
        <Button
          color="inherit"
          startIcon={<SaveIcon />}
          onClick={handleSave}
        >
          保存
        </Button>
      </Toolbar>
    </MuiAppBar>
  );
};
