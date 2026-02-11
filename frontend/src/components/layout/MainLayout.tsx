// Main layout component

import { Box, Toolbar, Snackbar, Alert, CircularProgress, Backdrop } from '@mui/material';
import { AppBar } from './AppBar';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../stores';

const DRAWER_WIDTH = 240;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { snackbar, hideSnackbar, isLoading } = useUIStore();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={hideSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Loading backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};
