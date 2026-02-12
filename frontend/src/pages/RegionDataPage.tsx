// Region data page (地区データ)

import { Box, Typography, Paper, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { useProjectStore, useUIStore } from '../stores';
import {
  OutdoorConditionsDetailTable,
  HeatingGroundTemperatureTable,
  StandardSolarGainTable,
  RegionBasicInfo
} from '../components/region';
import {
  fetchAllReferenceData,
  getOutdoorConditionByCity,
  getGroundTemperatureByCity,
  getSolarGainByCity,
  ReferenceData
} from '../services/referenceData';

export const RegionDataPage: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { showSnackbar } = useUIStore();

  const [referenceData, setReferenceData] = useState<Partial<ReferenceData> | null>(null);
  const [isLoadingReference, setIsLoadingReference] = useState(true);

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

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          プロジェクトが読み込まれていません。設計条件ページで新規プロジェクトを作成してください。
        </Typography>
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
  const solarGain = referenceData && cityLabel
    ? getSolarGainByCity(referenceData as ReferenceData, cityLabel)
    : null;

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4">地区データ</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          地域: {currentProject.designConditions.region} {cityLabel && `/ 地点: ${cityLabel}`}
        </Typography>
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

      {/* Standard Solar Gain */}
      {!isLoadingReference && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <StandardSolarGainTable data={solarGain} city={cityLabel} />
        </Paper>
      )}
    </Box>
  );
};
