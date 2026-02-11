// Indoor data master types (屋内データ)

import { SeasonalConditions, NamedEntity } from './common';

// Tab 1: 設計用屋内条件マスタ (Indoor Design Conditions Master)
export interface IndoorConditionMaster extends NamedEntity {
  summer: {
    dryBulbTemp: number;        // 乾球温度 [°C]
    relativeHumidity: number;   // 相対湿度 [%]
    absoluteHumidity: number;   // 絶対湿度 [kg/kg(DA)]
    enthalpy: number;           // エンタルピー [kJ/kg(DA)]
    wetBulbTemp: number;        // 湿球温度 [°C]
  };
  winter: {
    dryBulbTemp: number;
    relativeHumidity: number;
    absoluteHumidity: number;
    enthalpy: number;
    wetBulbTemp: number;
  };
}

// Tab 2: 照明器具の消費電力マスタ (Lighting Power Master)
export interface LightingPowerMaster extends NamedEntity {
  designIlluminance: number;  // 設計照度 [lx]
  powerDensity: {
    fluorescentDownlight: number;      // 蛍光灯ダウンライト [W/m²]
    fluorescentLouver: number;         // 蛍光灯ルーバー天井 [W/m²]
    fluorescentAcrylicCover: number;   // 蛍光灯アクリルカバー [W/m²]
    ledDownlight: number;              // LEDダウンライト [W/m²]
    ledLouver: number;                 // LEDルーバー天井 [W/m²]
  };
}

// Tab 3: 人体発熱量マスタ (Occupancy Heat Gain Master)
export interface OccupancyHeatMaster extends NamedEntity {
  summer: {
    sensibleHeat: number;  // 顕熱 [W/person]
    latentHeat: number;    // 潜熱 [W/person]
    totalHeat: number;     // 全熱 [W/person]
  };
  winter: {
    sensibleHeat: number;
    latentHeat: number;
    totalHeat: number;
  };
}

// Tab 4: 事務機器・OA機器の消費電力マスタ (Equipment Power Master)
export interface EquipmentPowerMaster extends NamedEntity {
  powerDensity: number;  // 消費電力密度 [W/m²]
}

// Tab 5: 非空調室差温度マスタ (Non-Air Conditioned Space Temperature Difference Master)
export interface NonAirConditionedTempDiffMaster extends NamedEntity {
  summer: {
    tempDiff: number;  // 温度差 [K]
  };
  winter: {
    tempDiff: number;
  };
}

// Combined type for all indoor master data
export interface IndoorMasterData {
  indoorConditions: IndoorConditionMaster[];
  lightingPower: LightingPowerMaster[];
  occupancyHeat: OccupancyHeatMaster[];
  equipmentPower: EquipmentPowerMaster[];
  nonAirConditionedTempDiff: NonAirConditionedTempDiffMaster[];
}
