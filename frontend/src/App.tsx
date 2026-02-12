// Main application component

import { useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { MainLayout } from './components/layout';
import { useUIStore } from './stores';
import { appService, sessionStateService } from './db';
import {
  DesignConditionsPage,
  RegionDataPage,
  IndoorDataPage,
  GlassStructurePage,
  RoomRegistrationPage,
  SystemRegistrationPage,
  LoadCheckPage,
} from './pages';

// Create MUI theme with mobile-friendly defaults
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    // Responsive font sizes
    h4: {
      fontSize: '1.75rem',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontSize: '1.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h6: {
      fontSize: '1.25rem',
      '@media (max-width:600px)': {
        fontSize: '1.1rem',
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          // Better touch targets on mobile
          minHeight: 42,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          // Smaller padding on mobile
          '@media (max-width:600px)': {
            padding: '8px 4px',
            fontSize: '0.75rem',
          },
        },
      },
    },
  },
});

export default function App() {
  const { currentPage, showSnackbar } = useUIStore();

  // Initialize application on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await appService.initialize();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        showSnackbar('アプリケーションの初期化に失敗しました', 'error');
      }
    };

    initializeApp();
  }, [showSnackbar]);

  // Save state when page changes or before unload
  useEffect(() => {
    sessionStateService.saveState();
  }, [currentPage]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStateService.saveState();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Render current page based on navigation state
  const renderPage = () => {
    switch (currentPage) {
      case 'design-conditions':
        return <DesignConditionsPage />;
      case 'region-data':
        return <RegionDataPage />;
      case 'indoor-data':
        return <IndoorDataPage />;
      case 'glass-structure':
        return <GlassStructurePage />;
      case 'room-registration':
        return <RoomRegistrationPage />;
      case 'system-registration':
        return <SystemRegistrationPage />;
      case 'load-check':
        return <LoadCheckPage />;
      default:
        return <DesignConditionsPage />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainLayout>{renderPage()}</MainLayout>
    </ThemeProvider>
  );
}
