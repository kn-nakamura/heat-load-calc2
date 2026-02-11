// System types (系統登録)

import { BaseEntity } from './common';

// System in the tree structure
export interface System extends BaseEntity {
  name: string;                          // 系統名
  parentId: string | null;               // 親系統ID (null for root systems)
  roomIds: string[];                     // 室IDリスト (rooms assigned to this system)
  order: number;                         // 表示順序
  notes: string;                         // 備考
}

// System tree node for UI display
export interface SystemTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  children: SystemTreeNode[];
  roomIds: string[];
  roomCount: number;                     // Number of rooms directly assigned
  totalRoomCount: number;                // Number of rooms including child systems
  isExpanded: boolean;                   // UI state for tree expansion
}

// System load calculation result (負荷確認)
export interface SystemLoadResult {
  systemId: string;
  systemName: string;

  // Summer cooling loads
  summerSensibleLoad: number;            // 夏期顕熱負荷 [W]
  summerLatentLoad: number;              // 夏期潜熱負荷 [W]
  summerTotalLoad: number;               // 夏期全熱負荷 [W]

  // Winter heating loads
  winterSensibleLoad: number;            // 冬期顕熱負荷 [W]
  winterLatentLoad: number;              // 冬期潜熱負荷 [W]
  winterTotalLoad: number;               // 冬期全熱負荷 [W]

  // Air volume
  outdoorAirVolume: number;              // 外気量 [m³/h]
  exhaustAirVolume: number;              // 排気量 [m³/h]

  // Room count
  roomCount: number;                     // 室数

  // Breakdown by room
  roomLoads: RoomLoadResult[];
}

// Room load calculation result
export interface RoomLoadResult {
  roomId: string;
  roomName: string;
  floor: string;

  // Summer loads breakdown
  summer: {
    // Envelope loads
    envelopeLoad: number;                // 構造体負荷 [W]
    solarLoad: number;                   // 日射負荷 [W]

    // Internal loads
    lightingLoad: number;                // 照明負荷 [W]
    occupancySensibleLoad: number;       // 人体顕熱負荷 [W]
    occupancyLatentLoad: number;         // 人体潜熱負荷 [W]
    equipmentLoad: number;               // 機器負荷 [W]
    otherSensibleLoad: number;           // その他顕熱負荷 [W]
    otherLatentLoad: number;             // その他潜熱負荷 [W]

    // Ventilation loads
    outdoorAirSensibleLoad: number;      // 外気顕熱負荷 [W]
    outdoorAirLatentLoad: number;        // 外気潜熱負荷 [W]
    infiltrationSensibleLoad: number;    // すきま風顕熱負荷 [W]
    infiltrationLatentLoad: number;      // すきま風潜熱負荷 [W]

    // Totals
    totalSensibleLoad: number;           // 顕熱負荷合計 [W]
    totalLatentLoad: number;             // 潜熱負荷合計 [W]
    totalLoad: number;                   // 全熱負荷合計 [W]
  };

  // Winter loads breakdown
  winter: {
    envelopeLoad: number;
    lightingLoad: number;
    occupancySensibleLoad: number;
    occupancyLatentLoad: number;
    equipmentLoad: number;
    otherSensibleLoad: number;
    otherLatentLoad: number;
    outdoorAirSensibleLoad: number;
    outdoorAirLatentLoad: number;
    infiltrationSensibleLoad: number;
    infiltrationLatentLoad: number;
    totalSensibleLoad: number;
    totalLatentLoad: number;
    totalLoad: number;
  };

  // Air volumes
  outdoorAirVolume: number;
  infiltrationVolume: number;
}
