// Room types (室登録)

import { BaseEntity, Orientation } from './common';
import { EnvelopeComponentType } from './envelopeMaster';

// Envelope row in the room structure table (構造体 tab)
export interface EnvelopeRow {
  rowNumber: number;                     // 行番号
  orientation: Orientation;              // 方位
  code: string | null;                   // コード (references master data)
  codeType: EnvelopeComponentType | null; // コード種類
  width: number | null;                  // 幅 [m]
  height: number | null;                 // 高さ [m]
  area: number | null;                   // 面積 [m²] (calculated: width × height)
  overhangArea: number | null;           // ひさし面積 [m²] (only for windows with overhang)
  totalArea: number;                     // 合計面積 [m²] (calculated)
  overhangCode: string | null;           // ひさしコード (references OverhangMaster)
  nonAirConditionedDiff: string | null;  // 非空調差温度コード (references NonAirConditionedTempDiffMaster)
  undergroundDepth: string | null;       // 地中深さ (for underground walls)
  remarks: string;                       // 備考
}

// Room envelope data (構造体 tab)
export interface RoomEnvelope {
  rows: EnvelopeRow[];
}

// Room indoor conditions (室内条件 tab)
export interface RoomIndoorConditions {
  indoorConditionCode: string | null;    // 室内条件コード (references IndoorConditionMaster)
  lightingCode: string | null;           // 照明コード (references LightingPowerMaster)
  lightingType: string | null;           // 照明タイプ (蛍光灯ダウンライト, etc.)
  occupancyCode: string | null;          // 人体発熱コード (references OccupancyHeatMaster)
  equipmentCode: string | null;          // 機器コード (references EquipmentPowerMaster)
}

// Room calculation conditions (計算条件 tab)
export interface RoomCalculationConditions {
  // 外気量・換気
  outdoorAirVolume: number | null;       // 外気量 [m³/h]
  outdoorAirVolumePerArea: number | null; // 外気量/床面積 [m³/(h·m²)] (calculated)
  outdoorAirVolumePerPerson: number | null; // 外気量/人 [m³/(h·人)] (calculated)
  ventilationCount: number | null;       // 換気回数 [回/h] (calculated)

  // すきま風・隙間
  infiltrationMethod: string | null;     // すきま風算定方法
  infiltrationArea: number | null;       // 隙間相当面積 [cm²]
  windowType: string | null;             // サッシ種類
  airtightness: string | null;           // 気密性
  windSpeed: number | null;              // 風速 [m/s]
  infiltrationVolume: number | null;     // すきま風量 [m³/h] (calculated)

  // 在室人数
  occupancyDensity: number | null;       // 在室密度 [人/m²]
  occupancyCount: number | null;         // 在室人数 [人] (calculated: density × floor area)

  // その他負荷
  otherSensibleLoad: number | null;      // その他顕熱 [W]
  otherLatentLoad: number | null;        // その他潜熱 [W]
}

// Room system notes (系統・備考 tab)
export interface RoomSystemNotes {
  systemId: string | null;               // 系統ID (references System)
  systemName: string | null;             // 系統名 (display only, from System)
  notes: string;                         // 備考
}

// Complete room data structure
export interface Room extends BaseEntity {
  // Basic information
  floor: string;                         // 階
  roomNumber: string;                    // 室番号
  roomName: string;                      // 室名

  // Floor dimensions
  floorAreaFormula: string;              // 床面積算式 (e.g., "10*8")
  floorArea: number;                     // 床面積 [m²] (calculated from formula)
  floorHeight: number;                   // 階高 [m]
  ceilingHeight: number;                 // 天井高 [m]
  roomVolume: number;                    // 室容積 [m³] (calculated: floorArea × ceilingHeight)
  roomCount: number;                     // 室数

  // Tab data
  envelope: RoomEnvelope;
  indoorConditions: RoomIndoorConditions;
  calculationConditions: RoomCalculationConditions;
  systemNotes: RoomSystemNotes;
}

// Room list view data (simplified for list display)
export interface RoomListItem {
  id: string;
  floor: string;
  roomNumber: string;
  roomName: string;
  floorArea: number;
  systemName: string | null;
}
