// Location settings form component

import { Box, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Autocomplete, Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Search as SearchIcon } from '@mui/icons-material';
import { useEffect, useRef } from 'react';
import { DesignConditions } from '../../types';
import { useProjectStore } from '../../stores';
import { searchLocationsByCity, findNearestLocation, getOutdoorConditionByCity } from '../../services/referenceData';

interface LocationSettingsFormProps {
  formData: DesignConditions;
  onChange: (field: keyof DesignConditions, value: any) => void;
}

const regions = ['1地域', '2地域', '3地域', '4地域', '5地域', '6地域', '7地域', '8地域'];
const solarRepresentativeCities = ['札幌', '仙台', '東京', '大阪', '福岡', '那覇']; // 日射計算用代表地区
const orientationBases = ['真北', '磁北'];

export const LocationSettingsForm: React.FC<LocationSettingsFormProps> = ({ formData, onChange }) => {
  const { referenceData } = useProjectStore();
  const isInitialized = useRef(false);

  const availableCities = referenceData?.location_data?.records.map((r) => r.city) || [];

  // Get representative city for each region
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

  // Get solar representative city based on selected city
  const getSolarRepresentativeCity = (city: string): string => {
    // Map cities to their nearest solar radiation representative city
    const cityToRepresentativeMap: { [key: string]: string } = {
      '札幌': '札幌',
      '旭川': '札幌',
      '帯広': '札幌',
      '釧路': '札幌',
      '函館': '札幌',
      '盛岡': '仙台',
      '仙台': '仙台',
      '秋田': '仙台',
      '山形': '仙台',
      '福島': '仙台',
      '新潟': '仙台',
      '東京': '東京',
      '横浜': '東京',
      '千葉': '東京',
      'さいたま': '東京',
      '宇都宮': '東京',
      '前橋': '東京',
      '水戸': '東京',
      '長野': '東京',
      '名古屋': '東京',
      '岐阜': '東京',
      '静岡': '東京',
      '大阪': '大阪',
      '京都': '大阪',
      '神戸': '大阪',
      '奈良': '大阪',
      '和歌山': '大阪',
      '岡山': '大阪',
      '広島': '大阪',
      '高松': '大阪',
      '松江': '大阪',
      '鳥取': '大阪',
      '福岡': '福岡',
      '北九州': '福岡',
      '佐賀': '福岡',
      '長崎': '福岡',
      '熊本': '福岡',
      '大分': '福岡',
      '宮崎': '福岡',
      '鹿児島': '福岡',
      '那覇': '那覇',
    };
    return cityToRepresentativeMap[city] || '東京';
  };

  const handleCitySelect = (city: string | null) => {
    if (!city || !referenceData) return;

    const location = referenceData.location_data?.records.find((r) => r.city === city);
    if (!location) return;

    onChange('locationLabel', city);
    onChange('latitude', location.latitude_deg);
    onChange('longitude', location.longitude_deg);

    // Auto-set solar representative city based on selected city
    const solarCity = getSolarRepresentativeCity(city);
    onChange('solarRegion', solarCity);

    // Also update outdoor conditions based on the city
    const outdoorCondition = getOutdoorConditionByCity(referenceData as any, city);
    if (outdoorCondition) {
      onChange('outdoorSummer', {
        dryBulbTemp: outdoorCondition.cooling_drybulb_14_c,
        wetBulbTemp: outdoorCondition.cooling_wetbulb_14_c,
        relativeHumidity: outdoorCondition.cooling_rh_14_pct,
        absoluteHumidity: outdoorCondition.cooling_abs_humidity_14_g_per_kgda / 1000, // Convert g to kg
        enthalpy: outdoorCondition.cooling_enthalpy_14_kj_per_kgda,
      });
      onChange('outdoorWinter', {
        dryBulbTemp: outdoorCondition.heating_drybulb_c,
        wetBulbTemp: outdoorCondition.heating_wetbulb_c,
        relativeHumidity: outdoorCondition.heating_rh_pct,
        absoluteHumidity: outdoorCondition.heating_abs_humidity_g_per_kgda / 1000, // Convert g to kg
        enthalpy: outdoorCondition.heating_enthalpy_kj_per_kgda,
      });
    }
  };

  const handleRegionChange = (newRegion: string) => {
    onChange('region', newRegion);

    // Auto-select representative city for the region
    const representativeCity = getRepresentativeCityForRegion(newRegion);
    handleCitySelect(representativeCity);
  };

  const handleSearchNearby = () => {
    if (!formData.latitude || !formData.longitude || !referenceData) return;

    const result = findNearestLocation(referenceData as any, formData.latitude, formData.longitude);
    if (result) {
      handleCitySelect(result.location.city);
    }
  };

  // Auto-set representative city on initial load if location is not set
  useEffect(() => {
    if (!isInitialized.current && referenceData && !formData.locationLabel && formData.region) {
      const representativeCity = getRepresentativeCityForRegion(formData.region);
      const location = referenceData.location_data?.records.find((r) => r.city === representativeCity);
      if (location) {
        onChange('locationLabel', representativeCity);
        onChange('latitude', location.latitude_deg);
        onChange('longitude', location.longitude_deg);

        // Auto-set solar representative city based on selected city
        const solarCity = getSolarRepresentativeCity(representativeCity);
        onChange('solarRegion', solarCity);

        // Also update outdoor conditions based on the city
        const outdoorCondition = getOutdoorConditionByCity(referenceData as any, representativeCity);
        if (outdoorCondition) {
          onChange('outdoorSummer', {
            dryBulbTemp: outdoorCondition.cooling_drybulb_14_c,
            wetBulbTemp: outdoorCondition.cooling_wetbulb_14_c,
            relativeHumidity: outdoorCondition.cooling_rh_14_pct,
            absoluteHumidity: outdoorCondition.cooling_abs_humidity_14_g_per_kgda / 1000,
            enthalpy: outdoorCondition.cooling_enthalpy_14_kj_per_kgda,
          });
          onChange('outdoorWinter', {
            dryBulbTemp: outdoorCondition.heating_drybulb_c,
            wetBulbTemp: outdoorCondition.heating_wetbulb_c,
            relativeHumidity: outdoorCondition.heating_rh_pct,
            absoluteHumidity: outdoorCondition.heating_abs_humidity_g_per_kgda / 1000,
            enthalpy: outdoorCondition.heating_enthalpy_kj_per_kgda,
          });
        }
      }
      isInitialized.current = true;
    }
  }, [referenceData, formData.locationLabel, formData.region, onChange]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        地域設定
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Autocomplete
            freeSolo
            options={availableCities}
            value={formData.locationLabel || ''}
            onInputChange={(_, newValue) => {
              onChange('locationLabel', newValue);
            }}
            onChange={(_, newValue) => {
              if (typeof newValue === 'string') {
                handleCitySelect(newValue);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="地点名"
                placeholder="例: 東京、大阪、札幌"
                helperText="都市名で検索してください"
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <FormControl fullWidth>
            <InputLabel>地域区分</InputLabel>
            <Select
              value={formData.region || '6地域'}
              label="地域区分"
              onChange={(e) => handleRegionChange(e.target.value)}
            >
              {regions.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <FormControl fullWidth>
            <InputLabel>日射計算用地域</InputLabel>
            <Select
              value={formData.solarRegion || '東京'}
              label="日射計算用地域"
              onChange={(e) => onChange('solarRegion', e.target.value)}
            >
              {solarRepresentativeCities.map((city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="緯度 [°]"
            value={formData.latitude || ''}
            onChange={(e) => onChange('latitude', parseFloat(e.target.value) || null)}
            inputProps={{ step: 0.01 }}
            placeholder="北緯"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="経度 [°]"
            value={formData.longitude || ''}
            onChange={(e) => onChange('longitude', parseFloat(e.target.value) || null)}
            inputProps={{ step: 0.01 }}
            placeholder="東経"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={handleSearchNearby}
            disabled={!formData.latitude || !formData.longitude}
          >
            最寄りの地点を検索
          </Button>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>方位基準</InputLabel>
            <Select
              value={formData.orientationBasis || '真北'}
              label="方位基準"
              onChange={(e) => onChange('orientationBasis', e.target.value)}
            >
              {orientationBases.map((basis) => (
                <MenuItem key={basis} value={basis}>
                  {basis}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="方位角度 [°]"
            value={formData.orientationAngle || 0}
            onChange={(e) => onChange('orientationAngle', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 1 }}
            helperText="真北からの偏角"
          />
        </Grid>
      </Grid>
    </Box>
  );
};
