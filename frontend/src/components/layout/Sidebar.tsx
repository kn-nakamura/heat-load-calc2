// Sidebar navigation component

import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider, useMediaQuery, useTheme } from '@mui/material';
import {
  Settings as SettingsIcon,
  Public as PublicIcon,
  Home as HomeIcon,
  Window as WindowIcon,
  MeetingRoom as RoomIcon,
  AccountTree as SystemIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useUIStore, PageId } from '../../stores';

const DRAWER_WIDTH = 240;

interface NavigationItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'design-conditions',
    label: '設計条件',
    icon: <SettingsIcon />,
  },
  {
    id: 'region-data',
    label: '地区データ',
    icon: <PublicIcon />,
  },
  {
    id: 'indoor-data',
    label: '屋内データ',
    icon: <HomeIcon />,
  },
  {
    id: 'glass-structure',
    label: '窓ガラス・構造体',
    icon: <WindowIcon />,
  },
  {
    id: 'room-registration',
    label: '室登録',
    icon: <RoomIcon />,
  },
  {
    id: 'system-registration',
    label: '系統登録',
    icon: <SystemIcon />,
  },
  {
    id: 'load-check',
    label: '負荷確認',
    icon: <AssessmentIcon />,
  },
];

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, sidebarOpen, toggleSidebar } = useUIStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNavigate = (pageId: PageId) => {
    setCurrentPage(pageId);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      toggleSidebar();
    }
  };

  const drawerContent = (
    <>
      <Toolbar>
        <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
          熱負荷計算
        </span>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentPage === item.id}
              onClick={() => handleNavigate(item.id)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <>
      {/* Mobile: Temporary drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={sidebarOpen}
          onClose={toggleSidebar}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        /* Desktop: Permanent drawer */
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};
