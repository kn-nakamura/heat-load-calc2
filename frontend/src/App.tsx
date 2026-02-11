// Main application component

import { useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { MainLayout } from './components/layout';
import { useUIStore } from './stores';
import { appService } from './db';
import {
  DesignConditionsPage,
  RegionDataPage,
  IndoorDataPage,
  GlassStructurePage,
  RoomRegistrationPage,
  SystemRegistrationPage,
  LoadCheckPage,
} from './pages';

// Create MUI theme
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
