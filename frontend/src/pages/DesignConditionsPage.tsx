// Design conditions page (設計条件)

import { Box, Typography, Paper, Button, Divider } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useProjectStore, useUIStore } from '../stores';
import {
  AddressSearchForm,
  BuildingInfoForm,
  LocationSettingsForm,
  OutdoorConditionsForm,
  CalculationSettingsForm,
} from '../components/design';
import { DesignConditions } from '../types';
import { masterDataService } from '../db';
import { NominatimSearchResult, extractLocationName } from '../services/addressSearch';
import { findNearestLocation, getOutdoorConditionByCity } from '../services/referenceData';

export const DesignConditionsPage: React.FC = () => {
  const { currentProject, updateDesignConditions, createNewProject, referenceData } = useProjectStore();
  const { showSnackbar } = useUIStore();

  const [formData, setFormData] = useState<DesignConditions | null>(null);

  useEffect(() => {
    // Create a new project if none exists
    if (!currentProject) {
      createNewProject('新規プロジェクト');
    }
  }, [currentProject, createNewProject]);

  useEffect(() => {
    if (currentProject) {
      setFormData(currentProject.designConditions);
    }
  }, [currentProject]);

  const handleChange = (field: keyof DesignConditions, value: any) => {
    if (!formData) return;
    setFormData((prev) => ({ ...prev!, [field]: value }));
  };

  const handleAddressSelect = (result: NominatimSearchResult) => {
    if (!formData || !referenceData) return;

    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    // Set location
    const locationName = extractLocationName(result);
    setFormData((prev) => ({
      ...prev!,
      buildingLocation: result.display_name,
      locationLabel: locationName,
      latitude: lat,
      longitude: lon,
    }));

    // Find nearest weather station
    const nearest = findNearestLocation(referenceData as any, lat, lon);
    if (nearest) {
      const { location, distance } = nearest;

      showSnackbar(`最寄りの気象データ地点: ${location.city} (約${distance.toFixed(1)}km)`, 'info');

      // Get outdoor conditions for the nearest city
      const outdoorCondition = getOutdoorConditionByCity(referenceData as any, location.city);
      if (outdoorCondition) {
        setFormData((prev) => ({
          ...prev!,
          locationLabel: location.city,
          latitude: location.latitude_deg,
          longitude: location.longitude_deg,
          outdoorSummer: {
            dryBulbTemp: outdoorCondition.cooling_drybulb_14_c,
            wetBulbTemp: outdoorCondition.cooling_wetbulb_14_c,
            relativeHumidity: outdoorCondition.cooling_rh_14_pct,
            absoluteHumidity: outdoorCondition.cooling_abs_humidity_14_g_per_kgda / 1000,
            enthalpy: outdoorCondition.cooling_enthalpy_14_kj_per_kgda,
          },
          outdoorWinter: {
            dryBulbTemp: outdoorCondition.heating_drybulb_c,
            wetBulbTemp: outdoorCondition.heating_wetbulb_c,
            relativeHumidity: outdoorCondition.heating_rh_pct,
            absoluteHumidity: outdoorCondition.heating_abs_humidity_g_per_kgda / 1000,
            enthalpy: outdoorCondition.heating_enthalpy_kj_per_kgda,
          },
        }));

        showSnackbar('外気設計条件を自動設定しました', 'success');
      }
    }
  };

  const handleSave = async () => {
    if (!formData) {
      showSnackbar('データがありません', 'error');
      return;
    }

    if (!formData.buildingName) {
      showSnackbar('建物名称を入力してください', 'error');
      return;
    }

    try {
      updateDesignConditions(formData);
      await masterDataService.saveAllMasterData();
      showSnackbar('保存しました', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showSnackbar('保存に失敗しました', 'error');
    }
  };

  if (!formData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">設計条件</Typography>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
          保存
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        {/* Address Search */}
        <AddressSearchForm onAddressSelect={handleAddressSelect} />

        <Divider sx={{ my: 4 }} />

        {/* Building Information */}
        <BuildingInfoForm formData={formData} onChange={handleChange} />

        <Divider sx={{ my: 4 }} />

        {/* Location Settings */}
        <LocationSettingsForm formData={formData} onChange={handleChange} />

        <Divider sx={{ my: 4 }} />

        {/* Outdoor Design Conditions */}
        <OutdoorConditionsForm formData={formData} onChange={handleChange} />

        <Divider sx={{ my: 4 }} />

        {/* Calculation Settings */}
        <CalculationSettingsForm formData={formData} onChange={handleChange} />

        {/* Save button at bottom */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave}>
            保存
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
