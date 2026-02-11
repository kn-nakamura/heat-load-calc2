// Load check page (負荷確認)

import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Calculate as CalculateIcon, GetApp as DownloadIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useProjectStore, useRoomStore, useSystemStore } from '../stores';
import { LoadSummaryCard, LoadResultsTable } from '../components/load';
import { SystemLoadResult } from '../types/system';
import { calculateAllSystemLoads } from '../services/loadCalculation';

export const LoadCheckPage: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { rooms } = useRoomStore();
  const { systems } = useSystemStore();

  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [loadResults, setLoadResults] = useState<SystemLoadResult[]>([]);
  const [calculating, setCalculating] = useState(false);

  // Auto-select first system when systems change
  useEffect(() => {
    if (systems.length > 0 && !selectedSystemId) {
      setSelectedSystemId(systems[0].id);
    }
  }, [systems, selectedSystemId]);

  const handleCalculate = () => {
    if (!currentProject) {
      return;
    }

    setCalculating(true);

    // Simulate calculation delay for better UX
    setTimeout(() => {
      const results = calculateAllSystemLoads(
        systems,
        rooms,
        currentProject.designConditions,
        currentProject.regionClimateData || undefined
      );
      setLoadResults(results);
      setCalculating(false);
    }, 500);
  };

  const handleExport = () => {
    // Export to CSV or Excel
    // This is a placeholder for future implementation
    alert('エクスポート機能は今後実装予定です');
  };

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          プロジェクトが読み込まれていません。設計条件ページで新規プロジェクトを作成してください。
        </Typography>
      </Box>
    );
  }

  const selectedResult = loadResults.find((r) => r.systemId === selectedSystemId);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">負荷確認</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={calculating ? <CircularProgress size={20} /> : <CalculateIcon />}
            onClick={handleCalculate}
            disabled={calculating || systems.length === 0 || rooms.length === 0}
          >
            {calculating ? '計算中...' : '負荷計算実行'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={loadResults.length === 0}
          >
            結果出力
          </Button>
        </Box>
      </Box>

      {/* Validation warnings */}
      {systems.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          系統が登録されていません。系統登録ページで系統を作成してください。
        </Alert>
      )}

      {rooms.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          室が登録されていません。室登録ページで室を作成してください。
        </Alert>
      )}

      {systems.length > 0 && rooms.length > 0 && loadResults.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          「負荷計算実行」ボタンをクリックして計算を開始してください。
        </Alert>
      )}

      {/* System selector */}
      {systems.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel>系統選択</InputLabel>
            <Select value={selectedSystemId} label="系統選択" onChange={(e) => setSelectedSystemId(e.target.value)}>
              {systems.map((system) => (
                <MenuItem key={system.id} value={system.id}>
                  {system.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Load summary */}
      {selectedResult && (
        <Box sx={{ mb: 3 }}>
          <LoadSummaryCard systemLoad={selectedResult} />
        </Box>
      )}

      {/* Detailed results table */}
      {selectedResult && (
        <Box>
          <Typography variant="h6" gutterBottom>
            室別負荷内訳
          </Typography>
          <LoadResultsTable roomLoads={selectedResult.roomLoads} />
        </Box>
      )}

      {/* Project info */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary">
          プロジェクト: {currentProject.name} | 地域: {currentProject.designConditions.region} | 系統数:{' '}
          {systems.length} | 室数: {rooms.length}
        </Typography>
      </Paper>
    </Box>
  );
};
