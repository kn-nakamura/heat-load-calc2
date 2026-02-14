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
import { Calculate as CalculateIcon, GetApp as DownloadIcon, Cloud as CloudIcon, Computer as ComputerIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useProjectStore, useRoomStore, useSystemStore, useUIStore, useMasterDataStore } from '../stores';
import { LoadSummaryCard, LoadResultsTable } from '../components/load';
import { SystemLoadResult } from '../types/system';
import { calculateAllSystemLoads } from '../services/loadCalculation';
import { calculateWithBackend, isBackendAvailable } from '../services/backendCalculation';

export const LoadCheckPage: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { rooms } = useRoomStore();
  const { systems } = useSystemStore();
  const { lightingPower, occupancyHeat, equipmentPower } = useMasterDataStore();
  const { showSnackbar } = useUIStore();

  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [loadResults, setLoadResults] = useState<SystemLoadResult[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [useBackend, setUseBackend] = useState(true);

  // Check backend availability on mount
  useEffect(() => {
    isBackendAvailable().then((available) => {
      setBackendAvailable(available);
      if (!available) {
        showSnackbar('バックエンドに接続できません。フロントエンド計算を使用します。', 'warning');
      }
    });
  }, [showSnackbar]);

  // Auto-select first system when systems change
  useEffect(() => {
    if (systems.length > 0 && !selectedSystemId) {
      setSelectedSystemId(systems[0].id);
    }
  }, [systems, selectedSystemId]);

  const handleCalculate = async () => {
    if (!currentProject) {
      return;
    }

    setCalculating(true);

    try {
      let results: SystemLoadResult[];

      if (backendAvailable && useBackend) {
        // Use backend calculation
        showSnackbar('バックエンド計算を実行中...', 'info');
        results = await calculateWithBackend(currentProject, rooms, systems);
        showSnackbar('計算が完了しました（バックエンド使用）', 'success');
      } else {
        // Use frontend calculation
        showSnackbar('フロントエンド計算を実行中...', 'info');
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
        results = calculateAllSystemLoads(
          systems,
          rooms,
          currentProject.designConditions,
          currentProject.regionClimateData || undefined,
          lightingPower,
          occupancyHeat,
          equipmentPower
        );
        showSnackbar('計算が完了しました（簡易計算）', 'success');
      }

      setLoadResults(results);
      if (results.length > 0) {
        setSelectedSystemId(results[0].systemId);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      showSnackbar(
        `計算エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
        'error'
      );
    } finally {
      setCalculating(false);
    }
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
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        mb: 3,
        gap: 2
      }}>
        <Typography variant="h4" sx={{ mb: { xs: 1, sm: 0 } }}>負荷確認</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={calculating ? <CircularProgress size={20} /> : <CalculateIcon />}
            onClick={handleCalculate}
            disabled={calculating || rooms.length === 0}
            fullWidth
            sx={{ flex: { xs: '1 1 100%', sm: 'initial' } }}
          >
            {calculating ? '計算中...' : '負荷計算実行'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={loadResults.length === 0}
            fullWidth
            sx={{ flex: { xs: '1 1 100%', sm: 'initial' } }}
          >
            結果出力
          </Button>
        </Box>
      </Box>

      {/* Validation warnings */}
      {systems.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          系統が登録されていないため、全室を1つの集計結果として計算します。
        </Alert>
      )}

      {rooms.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          室が登録されていません。室登録ページで室を作成してください。
        </Alert>
      )}

      {/* Backend status */}
      {backendAvailable !== null && (
        <Alert
          severity={backendAvailable ? 'success' : 'warning'}
          icon={backendAvailable ? <CloudIcon /> : <ComputerIcon />}
          sx={{ mb: 3 }}
        >
          {backendAvailable
            ? 'バックエンド接続: 正常 - 詳細な熱負荷計算を使用します'
            : 'バックエンド未接続 - 簡易計算モードで動作します（参照データとの連携なし）'}
        </Alert>
      )}

      {rooms.length > 0 && loadResults.length === 0 && (
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
