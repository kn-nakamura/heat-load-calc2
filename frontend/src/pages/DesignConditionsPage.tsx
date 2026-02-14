// Design conditions page (設計条件)

import { Box, Typography, Paper, Button, Divider } from '@mui/material';
import { Save as SaveIcon, Download as DownloadIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { useProjectStore, useUIStore, useRoomStore, useSystemStore } from '../stores';
import {
  AddressSearchForm,
  BuildingInfoForm,
  LocationSettingsForm,
  OutdoorConditionsForm,
  CalculationSettingsForm,
} from '../components/design';
import { DesignConditions } from '../types';
import { masterDataService, appService } from '../db';
import { NominatimSearchResult, extractLocationName } from '../services/addressSearch';
import { findNearestLocation, getOutdoorConditionByCity } from '../services/referenceData';

export const DesignConditionsPage: React.FC = () => {
  const { currentProject, updateDesignConditions, createNewProject, referenceData, setCurrentProject } = useProjectStore();
  const { rooms } = useRoomStore();
  const { systems } = useSystemStore();
  const { showSnackbar } = useUIStore();

  const [formData, setFormData] = useState<DesignConditions | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    updateDesignConditions({ [field]: value } as Partial<DesignConditions>);
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
    updateDesignConditions({
      buildingLocation: result.display_name,
      locationLabel: locationName,
      latitude: lat,
      longitude: lon,
    });

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
          region: location.city,
          solarRegion: location.city,
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
        updateDesignConditions({
          locationLabel: location.city,
          latitude: location.latitude_deg,
          longitude: location.longitude_deg,
          region: location.city,
          solarRegion: location.city,
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
        });

        showSnackbar('外気設計条件と日射区分を自動設定しました', 'success');
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

  const handleExport = async () => {
    if (!currentProject) {
      showSnackbar('プロジェクトが読み込まれていません', 'error');
      return;
    }

    try {
      // Save current state before exporting
      await appService.saveAll();

      // Export all data (project, rooms, systems, master data)
      const dataStr = await appService.exportData();
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      const fileName = `${currentProject.designConditions.buildingName || 'project'}_${new Date().toISOString().split('T')[0]}.json`;
      link.download = fileName;
      link.click();

      URL.revokeObjectURL(url);
      showSnackbar('プロジェクト全体をエクスポートしました', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showSnackbar('エクスポートに失敗しました', 'error');
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('インポートすると現在のデータが上書きされます。続行しますか？')) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      const text = await file.text();

      // Import all data (project, rooms, systems, master data)
      await appService.importData(text);

      // Refresh form data from newly imported project
      const { currentProject: importedProject } = useProjectStore.getState();
      if (importedProject) {
        setFormData(importedProject.designConditions);
      }

      showSnackbar('プロジェクト全体をインポートしました', 'success');
    } catch (error) {
      console.error('Import error:', error);
      showSnackbar('インポートに失敗しました', 'error');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={handleImport}>
            インポート
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
            エクスポート
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
            保存
          </Button>
        </Box>
      </Box>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

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
