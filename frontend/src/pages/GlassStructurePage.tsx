// Glass and structure page (窓ガラス・構造体)

import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import { useUIStore, GlassStructureTab, useMasterDataStore } from '../stores';
import { MasterDataList, WindowGlassForm, ExteriorWallForm } from '../components/masterData';
import { WindowGlassMaster, ExteriorWallMaster } from '../types';
import { masterDataService } from '../db';

const tabs: { id: GlassStructureTab; label: string }[] = [
  { id: 'overhang', label: 'ひさし' },
  { id: 'window-glass', label: '窓ガラス' },
  { id: 'exterior-wall', label: '外壁' },
  { id: 'roof', label: '屋根' },
  { id: 'piloti-floor', label: 'ピロティ床' },
  { id: 'interior-wall', label: '内壁' },
  { id: 'ceiling-floor', label: '天井・床' },
  { id: 'underground-wall', label: '地中壁' },
  { id: 'earth-floor', label: '土間床' },
];

export const GlassStructurePage: React.FC = () => {
  const { glassStructureTab, setGlassStructureTab, showSnackbar } = useUIStore();
  const { windowGlass, exteriorWalls, addWindowGlass, addExteriorWall } = useMasterDataStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: GlassStructureTab) => {
    setGlassStructureTab(newValue);
    setSelectedId(null);
  };

  const handleAddWindowGlass = async () => {
    const now = new Date();
    const newItem: WindowGlassMaster = {
      id: crypto.randomUUID(),
      name: '新規窓ガラス',
      glassType: '複層ガラス',
      glassCode: '',
      blindType: 'なし',
      shadingCoefficient: 0.88,
      uValue: 2.9,
      remarks: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      addWindowGlass(newItem);
      await masterDataService.saveAllMasterData();
      setSelectedId(newItem.id);
      showSnackbar('新規項目を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const handleAddExteriorWall = async () => {
    const now = new Date();
    const newItem: ExteriorWallMaster = {
      id: crypto.randomUUID(),
      name: '新規外壁',
      wallType: '外壁',
      layers: [],
      exteriorSurfaceResistance: {
        summer: 0.04,
        winter: 0.04,
      },
      interiorSurfaceResistance: 0.11,
      totalResistance: {
        summer: 0,
        winter: 0,
      },
      uValue: {
        summer: 0,
        winter: 0,
      },
      remarks: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      addExteriorWall(newItem);
      await masterDataService.saveAllMasterData();
      setSelectedId(newItem.id);
      showSnackbar('新規項目を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const renderTabContent = () => {
    switch (glassStructureTab) {
      case 'window-glass':
        return (
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={windowGlass}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddWindowGlass}
                title="窓ガラス一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <WindowGlassForm selectedId={selectedId} />
            </Box>
          </Box>
        );

      case 'overhang':
        return (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">ひさしマスタ（実装予定）</Typography>
          </Box>
        );

      case 'exterior-wall':
        return (
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={exteriorWalls}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddExteriorWall}
                title="外壁一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <ExteriorWallForm selectedId={selectedId} />
            </Box>
          </Box>
        );

      case 'roof':
        return (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">屋根マスタ（実装予定）</Typography>
          </Box>
        );

      case 'piloti-floor':
        return (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">ピロティ床マスタ（実装予定）</Typography>
          </Box>
        );

      case 'interior-wall':
        return (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">内壁マスタ（実装予定）</Typography>
          </Box>
        );

      case 'ceiling-floor':
        return (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">天井・床マスタ（実装予定）</Typography>
          </Box>
        );

      case 'underground-wall':
        return (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">地中壁マスタ（実装予定）</Typography>
          </Box>
        );

      case 'earth-floor':
        return (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">土間床マスタ（実装予定）</Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        窓ガラス・構造体
      </Typography>
      <Paper sx={{ mt: 2 }}>
        <Tabs value={glassStructureTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {tabs.map((tab) => (
            <Tab key={tab.id} label={tab.label} value={tab.id} />
          ))}
        </Tabs>
        {renderTabContent()}
      </Paper>
    </Box>
  );
};
