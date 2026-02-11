// Project and design conditions types (設計条件)

import { BaseEntity, SeasonalConditions } from './common';

// Design conditions (設計条件 page)
export interface DesignConditions {
  // Building information
  buildingName: string;                  // 建物名称
  buildingLocation: string;              // 建物所在地
  buildingUsage: string;                 // 建物用途
  buildingStructure: string;             // 建物構造
  totalFloorArea: number | null;         // 延床面積 [m²]
  floorsAbove: number | null;            // 地上階数
  floorsBelow: number | null;            // 地下階数
  reportAuthor: string;                  // 作成者
  remarks: string;                       // 備考

  // Location settings
  region: string;                        // 地域区分 (e.g., "6地域")
  solarRegion: string;                   // 日射地域区分
  latitude: number | null;               // 緯度
  longitude: number | null;              // 経度
  locationLabel: string;                 // 地点名

  // Orientation settings
  orientationBasis: string;              // 方位基準 (e.g., "真北", "磁北")
  orientationAngle: number;              // 方位角度 [°]

  // Outdoor design conditions
  outdoorSummer: {
    dryBulbTemp: number;                 // 外気乾球温度 [°C]
    relativeHumidity: number;            // 外気相対湿度 [%]
    absoluteHumidity: number;            // 外気絶対湿度 [kg/kg(DA)]
    enthalpy: number;                    // 外気エンタルピー [kJ/kg(DA)]
    wetBulbTemp: number;                 // 外気湿球温度 [°C]
  };
  outdoorWinter: {
    dryBulbTemp: number;
    relativeHumidity: number;
    absoluteHumidity: number;
    enthalpy: number;
    wetBulbTemp: number;
  };

  // Calculation settings
  calculationMethod: string;             // 計算方法
  unitSystem: string;                    // 単位系 (SI, etc.)
}

// Region climate data (地区データ)
export interface RegionClimateData {
  region: string;                        // 地域区分

  // Monthly outdoor design temperatures
  monthlyTemperatures: {
    month: number;                       // 月 (1-12)
    dryBulbTemp: number;                 // 乾球温度 [°C]
    relativeHumidity: number;            // 相対湿度 [%]
  }[];

  // Solar radiation data by orientation
  solarRadiation: {
    month: number;                       // 月 (1-12)
    orientation: string;                 // 方位
    radiation: number;                   // 日射量 [W/m²]
  }[];

  // Ground temperature data
  groundTemperatures: {
    depth: number;                       // 深さ [m]
    summer: number;                      // 夏期地中温度 [°C]
    winter: number;                      // 冬期地中温度 [°C]
  }[];
}

// Complete project data
export interface Project extends BaseEntity {
  name: string;                          // プロジェクト名
  designConditions: DesignConditions;
  regionClimateData: RegionClimateData | null;

  // Timestamps
  lastCalculatedAt: Date | null;         // 最終計算日時
}

// Project metadata for list view
export interface ProjectListItem {
  id: string;
  name: string;
  buildingName: string;
  createdAt: Date;
  updatedAt: Date;
  lastCalculatedAt: Date | null;
}
