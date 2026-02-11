// Indoor data page (屋内データ)

import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import { useUIStore, IndoorDataTab, useMasterDataStore } from '../stores';
import {
  MasterDataList,
  IndoorConditionsForm,
  LightingPowerForm,
  OccupancyHeatForm,
  EquipmentPowerForm,
  NonAirConditionedTempDiffForm,
} from '../components/masterData';
import {
  IndoorConditionMaster,
  LightingPowerMaster,
  OccupancyHeatMaster,
  EquipmentPowerMaster,
  NonAirConditionedTempDiffMaster,
} from '../types';
import { masterDataService } from '../db';

const tabs: { id: IndoorDataTab; label: string }[] = [
  { id: 'indoor-conditions', label: '設計用屋内条件' },
  { id: 'lighting-power', label: '照明器具の消費電力' },
  { id: 'occupancy-heat', label: '人体発熱量' },
  { id: 'equipment-power', label: '事務機器・OA機器の消費電力' },
  { id: 'non-air-conditioned-temp-diff', label: '非空調室差温度' },
];

export const IndoorDataPage: React.FC = () => {
  const { indoorDataTab, setIndoorDataTab, showSnackbar } = useUIStore();
  const {
    indoorConditions,
    lightingPower,
    occupancyHeat,
    equipmentPower,
    nonAirConditionedTempDiff,
    addIndoorCondition,
    addLightingPower,
    addOccupancyHeat,
    addEquipmentPower,
    addNonAirConditionedTempDiff,
  } = useMasterDataStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: IndoorDataTab) => {
    setIndoorDataTab(newValue);
    setSelectedId(null);
  };

  const handleAddIndoorCondition = async () => {
    const now = new Date();
    const newItem: IndoorConditionMaster = {
      id: crypto.randomUUID(),
      name: '新規条件',
      summer: {
        dryBulbTemp: 26,
        relativeHumidity: 50,
        absoluteHumidity: 0.0105,
        enthalpy: 52.6,
        wetBulbTemp: 19.1,
      },
      winter: {
        dryBulbTemp: 22,
        relativeHumidity: 40,
        absoluteHumidity: 0.0066,
        enthalpy: 38.8,
        wetBulbTemp: 14.9,
      },
      remarks: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      addIndoorCondition(newItem);
      await masterDataService.saveAllMasterData();
      setSelectedId(newItem.id);
      showSnackbar('新規項目を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const handleAddLightingPower = async () => {
    const now = new Date();
    const newItem: LightingPowerMaster = {
      id: crypto.randomUUID(),
      name: '新規照明',
      designIlluminance: 500,
      powerDensity: {
        fluorescentDownlight: 15,
        fluorescentLouver: 18,
        fluorescentAcrylicCover: 16,
        ledDownlight: 8,
        ledLouver: 10,
      },
      remarks: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      addLightingPower(newItem);
      await masterDataService.saveAllMasterData();
      setSelectedId(newItem.id);
      showSnackbar('新規項目を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const handleAddOccupancyHeat = async () => {
    const now = new Date();
    const newItem: OccupancyHeatMaster = {
      id: crypto.randomUUID(),
      name: '新規人体発熱',
      summer: {
        sensibleHeat: 60,
        latentHeat: 50,
        totalHeat: 110,
      },
      winter: {
        sensibleHeat: 60,
        latentHeat: 50,
        totalHeat: 110,
      },
      remarks: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      addOccupancyHeat(newItem);
      await masterDataService.saveAllMasterData();
      setSelectedId(newItem.id);
      showSnackbar('新規項目を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const handleAddEquipmentPower = async () => {
    const now = new Date();
    const newItem: EquipmentPowerMaster = {
      id: crypto.randomUUID(),
      name: '新規機器',
      powerDensity: 15,
      remarks: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      addEquipmentPower(newItem);
      await masterDataService.saveAllMasterData();
      setSelectedId(newItem.id);
      showSnackbar('新規項目を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const handleAddNonAirConditionedTempDiff = async () => {
    const now = new Date();
    const newItem: NonAirConditionedTempDiffMaster = {
      id: crypto.randomUUID(),
      name: '新規差温度',
      summer: {
        tempDiff: 5,
      },
      winter: {
        tempDiff: -5,
      },
      remarks: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      addNonAirConditionedTempDiff(newItem);
      await masterDataService.saveAllMasterData();
      setSelectedId(newItem.id);
      showSnackbar('新規項目を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const renderTabContent = () => {
    switch (indoorDataTab) {
      case 'indoor-conditions':
        return (
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={indoorConditions}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddIndoorCondition}
                title="屋内条件一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <IndoorConditionsForm selectedId={selectedId} />
            </Box>
          </Box>
        );

      case 'lighting-power':
        return (
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={lightingPower}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddLightingPower}
                title="照明一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <LightingPowerForm selectedId={selectedId} />
            </Box>
          </Box>
        );

      case 'occupancy-heat':
        return (
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={occupancyHeat}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddOccupancyHeat}
                title="人体発熱一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <OccupancyHeatForm selectedId={selectedId} />
            </Box>
          </Box>
        );

      case 'equipment-power':
        return (
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={equipmentPower}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddEquipmentPower}
                title="機器一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <EquipmentPowerForm selectedId={selectedId} />
            </Box>
          </Box>
        );

      case 'non-air-conditioned-temp-diff':
        return (
          <Box sx={{ display: 'flex', height: '600px' }}>
            <Box sx={{ width: '33%', minWidth: '250px' }}>
              <MasterDataList
                items={nonAirConditionedTempDiff}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddNonAirConditionedTempDiff}
                title="差温度一覧"
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <NonAirConditionedTempDiffForm selectedId={selectedId} />
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
        屋内データ
      </Typography>
      <Paper sx={{ mt: 2 }}>
        <Tabs value={indoorDataTab} onChange={handleTabChange}>
          {tabs.map((tab) => (
            <Tab key={tab.id} label={tab.label} value={tab.id} />
          ))}
        </Tabs>
        {renderTabContent()}
      </Paper>
    </Box>
  );
};
