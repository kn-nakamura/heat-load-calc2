// Glass and structure page (窓ガラス・構造体)

import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import { useUIStore, GlassStructureTab, useMasterDataStore } from '../stores';
import {
  MasterDataList,
  OverhangForm,
  WindowGlassForm,
  ExteriorWallForm,
  RoofForm,
  PilotiFloorForm,
  InteriorWallForm,
  CeilingFloorForm,
  UndergroundWallForm,
  EarthFloorForm,
} from '../components/masterData';
import {
  OverhangMaster,
  WindowGlassMaster,
  ExteriorWallMaster,
  RoofMaster,
  PilotiFloorMaster,
  InteriorWallMaster,
  CeilingFloorMaster,
  UndergroundWallMaster,
  EarthFloorMaster,
} from '../types';
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
  const {
    overhangs,
    windowGlass,
    exteriorWalls,
    roofs,
    pilotiFloors,
    interiorWalls,
    ceilingFloors,
    undergroundWalls,
    earthFloors,
    addOverhang,
    addWindowGlass,
    addExteriorWall,
    addRoof,
    addPilotiFloor,
    addInteriorWall,
    addCeilingFloor,
    addUndergroundWall,
    addEarthFloor,
  } = useMasterDataStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: GlassStructureTab) => {
    setGlassStructureTab(newValue);
    setSelectedId(null);
  };

  const handleAddOverhang = async () => {
    const now = new Date();
    const newItem: OverhangMaster = {
      id: crypto.randomUUID(),
      name: '新規ひさし',
      overhangDepth: 0.5,
      windowHeight: 1.5,
      overhangHeight: 0.3,
      shadingFactor: 1.0,
      remarks: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      addOverhang(newItem);
      await masterDataService.saveAllMasterData();
      setSelectedId(newItem.id);
      showSnackbar('新規項目を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
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

  const handleAddRoof = async () => {
    const now = new Date();
    const newItem: RoofMaster = {
      id: crypto.randomUUID(),
      name: '新規屋根',
      roofType: '屋根',
      layers: [],
      exteriorSurfaceResistance: {
        summer: 0.04,
        winter: 0.04,
      },
      interiorSurfaceResistance: 0.09,
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
      addRoof(newItem);
      await masterDataService.saveAllMasterData();
      setSelectedId(newItem.id);
      showSnackbar('新規項目を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const handleAddPilotiFloor = async () => {
    const now = new Date();
    const newItem: PilotiFloorMaster = {
      id: crypto.randomUUID(),
      name: '新規ピロティ床',
      floorType: 'ピロティ床',
      layers: [],
      exteriorSurfaceResistance: {
        summer: 0.04,
        winter: 0.04,
      },
      interiorSurfaceResistance: 0.09,
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
      addPilotiFloor(newItem);
      await masterDataService.saveAllMasterData();
      setSelectedId(newItem.id);
      showSnackbar('新規項目を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const handleAddInteriorWall = async () => {
    const now = new Date();
    const newItem: InteriorWallMaster = {
      id: crypto.randomUUID(),
      name: '新規内壁',
      wallType: '内壁',
      layers: [],
      surfaceResistance: 0.11,
      totalResistance: 0,
      uValue: 0,
      remarks: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      addInteriorWall(newItem);
      await masterDataService.saveAllMasterData();
      setSelectedId(newItem.id);
      showSnackbar('新規項目を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const handleAddCeilingFloor = async () => {
    const now = new Date();
    const newItem: CeilingFloorMaster = {
      id: crypto.randomUUID(),
      name: '新規天井・床',
      elementType: 'ceiling',
      layers: [],
      surfaceResistance: 0.09,
      totalResistance: 0,
      uValue: 0,
      remarks: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      addCeilingFloor(newItem);
      await masterDataService.saveAllMasterData();
      setSelectedId(newItem.id);
      showSnackbar('新規項目を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const handleAddUndergroundWall = async () => {
    const now = new Date();
    const newItem: UndergroundWallMaster = {
      id: crypto.randomUUID(),
      name: '新規地中壁',
      wallType: '地中壁',
      layers: [],
      interiorSurfaceResistance: 0.11,
      totalResistance: 0,
      uValue: 0,
      remarks: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      addUndergroundWall(newItem);
      await masterDataService.saveAllMasterData();
      setSelectedId(newItem.id);
      showSnackbar('新規項目を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const handleAddEarthFloor = async () => {
    const now = new Date();
    const newItem: EarthFloorMaster = {
      id: crypto.randomUUID(),
      name: '新規土間床',
      floorType: '土間床',
      layers: [],
      interiorSurfaceResistance: 0.15,
      totalResistance: 0,
      uValue: 0,
      remarks: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      addEarthFloor(newItem);
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
      case 'overhang':
        return (
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={overhangs}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddOverhang}
                title="ひさし一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <OverhangForm selectedId={selectedId} />
            </Box>
          </Box>
        );

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
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={roofs}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddRoof}
                title="屋根一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <RoofForm selectedId={selectedId} />
            </Box>
          </Box>
        );

      case 'piloti-floor':
        return (
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={pilotiFloors}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddPilotiFloor}
                title="ピロティ床一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <PilotiFloorForm selectedId={selectedId} />
            </Box>
          </Box>
        );

      case 'interior-wall':
        return (
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={interiorWalls}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddInteriorWall}
                title="内壁一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <InteriorWallForm selectedId={selectedId} />
            </Box>
          </Box>
        );

      case 'ceiling-floor':
        return (
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={ceilingFloors}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddCeilingFloor}
                title="天井・床一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <CeilingFloorForm selectedId={selectedId} />
            </Box>
          </Box>
        );

      case 'underground-wall':
        return (
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={undergroundWalls}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddUndergroundWall}
                title="地中壁一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <UndergroundWallForm selectedId={selectedId} />
            </Box>
          </Box>
        );

      case 'earth-floor':
        return (
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={earthFloors}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddEarthFloor}
                title="土間床一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <EarthFloorForm selectedId={selectedId} />
            </Box>
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
