// Region data page (地区データ)

import { Box, Typography, Paper, Button, Grid, Alert } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useProjectStore, useUIStore } from '../stores';
import {
  MonthlyTemperatureTable,
  SolarRadiationTable,
  GroundTemperatureTable,
  OutdoorConditionsDetailTable,
  HeatingGroundTemperatureTable,
  RegionBasicInfo
} from '../components/region';
import { RegionClimateData } from '../types';
import { masterDataService } from '../db';
import {
  fetchAllReferenceData,
  getOutdoorConditionByCity,
  getGroundTemperatureByCity,
  ReferenceData
} from '../services/referenceData';

export const RegionDataPage: React.FC = () => {
  const { currentProject, updateRegionClimateData } = useProjectStore();
  const { showSnackbar } = useUIStore();

  const [formData, setFormData] = useState<RegionClimateData | null>(null);
  const [referenceData, setReferenceData] = useState<Partial<ReferenceData> | null>(null);
  const [isLoadingReference, setIsLoadingReference] = useState(true);

  useEffect(() => {
    if (currentProject) {
      if (currentProject.regionClimateData) {
        setFormData(currentProject.regionClimateData);
      } else {
        // Initialize with default data based on design conditions region
        const region = currentProject.designConditions.region;
        const newData: RegionClimateData = {
          region: region,
          monthlyTemperatures: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            dryBulbTemp: 0,
            relativeHumidity: 50,
          })),
          solarRadiation: [],
          groundTemperatures: [
            { depth: 0.5, summer: 15, winter: 15 },
            { depth: 1.0, summer: 15, winter: 15 },
            { depth: 2.0, summer: 15, winter: 15 },
          ],
        };
        setFormData(newData);
      }
    }
  }, [currentProject]);

  useEffect(() => {
    // Fetch reference data from backend
    const loadReferenceData = async () => {
      try {
        setIsLoadingReference(true);
        const data = await fetchAllReferenceData();
        setReferenceData(data);
      } catch (error) {
        console.error('Failed to fetch reference data:', error);
        showSnackbar('参照データの取得に失敗しました', 'warning');
      } finally {
        setIsLoadingReference(false);
      }
    };

    loadReferenceData();
  }, [showSnackbar]);

  const handleSave = async () => {
    if (!formData) {
      showSnackbar('データがありません', 'error');
      return;
    }

    try {
      updateRegionClimateData(formData);
      await masterDataService.saveAllMasterData();
      showSnackbar('保存しました', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showSnackbar('保存に失敗しました', 'error');
    }
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

  if (!formData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  // Get representative city for the region if no city is selected
  const getRepresentativeCityForRegion = (region: string): string => {
    const regionMap: { [key: string]: string } = {
      '1地域': '札幌',
      '2地域': '盛岡',
      '3地域': '仙台',
      '4地域': '東京',
      '5地域': '長野',
      '6地域': '東京',
      '7地域': '福岡',
      '8地域': '那覇',
    };
    return regionMap[region] || '東京';
  };

  // Get outdoor conditions and ground temperature for the selected city
  const isAutoSelectedCity = !currentProject.designConditions.locationLabel;
  const cityLabel = currentProject.designConditions.locationLabel ||
                    getRepresentativeCityForRegion(currentProject.designConditions.region);
  const outdoorConditions = referenceData && cityLabel
    ? getOutdoorConditionByCity(referenceData as ReferenceData, cityLabel)
    : null;
  const groundTemperature = referenceData && cityLabel
    ? getGroundTemperatureByCity(referenceData as ReferenceData, cityLabel)
    : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4">地区データ</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            地域: {formData.region} {cityLabel && `/ 地点: ${cityLabel}`}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
          保存
        </Button>
      </Box>

      {/* Auto-selected city notification */}
      {isAutoSelectedCity && (
        <Alert severity="info" sx={{ mb: 3 }}>
          地点が選択されていないため、{currentProject.designConditions.region}の代表地点として「{cityLabel}」のデータを表示しています。
          設計条件ページで地点を選択すると、選択した地点のデータが表示されます。
        </Alert>
      )}

      {/* Region Basic Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <RegionBasicInfo
          region={currentProject.designConditions.region}
          solarRegion={currentProject.designConditions.solarRegion}
          city={cityLabel}
          latitude={currentProject.designConditions.latitude}
          longitude={currentProject.designConditions.longitude}
          orientationBasis={currentProject.designConditions.orientationBasis}
          orientationAngle={currentProject.designConditions.orientationAngle}
        />
      </Paper>

      {/* Outdoor Conditions Detail */}
      {!isLoadingReference && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <OutdoorConditionsDetailTable data={outdoorConditions} />
        </Paper>
      )}

      {/* Heating Ground Temperature */}
      {!isLoadingReference && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <HeatingGroundTemperatureTable data={groundTemperature} />
        </Paper>
      )}

      {/* Monthly Temperature */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <MonthlyTemperatureTable
          data={formData.monthlyTemperatures}
          onChange={(data) => setFormData({ ...formData, monthlyTemperatures: data })}
        />
      </Paper>

      {/* Solar Radiation */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <SolarRadiationTable
          data={formData.solarRadiation}
          onChange={(data) => setFormData({ ...formData, solarRadiation: data })}
        />
      </Paper>

      {/* Ground Temperature (User Editable) */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <GroundTemperatureTable
          data={formData.groundTemperatures}
          onChange={(data) => setFormData({ ...formData, groundTemperatures: data })}
        />
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave}>
          保存
        </Button>
      </Box>
    </Box>
  );
};
