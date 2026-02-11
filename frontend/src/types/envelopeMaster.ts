// Envelope/Structure master types (窓ガラス・構造体)

import { NamedEntity } from './common';

// Material properties for construction layers
export interface MaterialMaster extends NamedEntity {
  thermalConductivity: number | null;  // 熱伝導率 [W/(m·K)]
  thermalResistance: number | null;    // 熱抵抗 [m²·K/W]
  density: number | null;              // 密度 [kg/m³]
  specificHeat: number | null;         // 比熱 [kJ/(kg·K)]
}

// Construction layer for multi-layer structures
export interface ConstructionLayer {
  layerNumber: number;              // 層番号
  materialId: string | null;        // 材料ID (references MaterialMaster)
  materialName: string;             // 材料名 (display name)
  thickness: number | null;         // 厚さ [mm]
  thermalConductivity: number | null;  // 熱伝導率 [W/(m·K)]
  thermalResistance: number | null;    // 熱抵抗 [m²·K/W]
}

// Tab 1: ひさしマスタ (Overhang Master)
export interface OverhangMaster extends NamedEntity {
  overhangDepth: number;    // ひさし出寸法 [m]
  windowHeight: number;     // 窓高さ [m]
  overhangHeight: number;   // ひさし高さ [m]
  shadingFactor: number;    // 遮蔽係数 (calculated)
}

// Tab 2: 窓ガラスマスタ (Window Glass Master)
export interface WindowGlassMaster extends NamedEntity {
  glassType: string;             // ガラス種類
  glassCode: string;             // ガラスコード
  blindType: string;             // ブラインド種類
  shadingCoefficient: number;    // 遮蔽係数
  uValue: number;                // 熱貫流率 [W/(m²·K)]
}

// Tab 3: 外壁マスタ (Exterior Wall Master)
export interface ExteriorWallMaster extends NamedEntity {
  wallType: string;                    // 壁種類
  layers: ConstructionLayer[];         // 構成層
  exteriorSurfaceResistance: {
    summer: number;  // 室外側表面熱伝達抵抗（夏期） [m²·K/W]
    winter: number;  // 室外側表面熱伝達抵抗（冬期） [m²·K/W]
  };
  interiorSurfaceResistance: number;   // 室内側表面熱伝達抵抗 [m²·K/W]
  totalResistance: {
    summer: number;  // 総熱抵抗（夏期） [m²·K/W] (calculated)
    winter: number;  // 総熱抵抗（冬期） [m²·K/W] (calculated)
  };
  uValue: {
    summer: number;  // 熱貫流率（夏期） [W/(m²·K)] (calculated)
    winter: number;  // 熱貫流率（冬期） [W/(m²·K)] (calculated)
  };
}

// Tab 4: 屋根マスタ (Roof Master)
export interface RoofMaster extends NamedEntity {
  roofType: string;
  layers: ConstructionLayer[];
  exteriorSurfaceResistance: {
    summer: number;
    winter: number;
  };
  interiorSurfaceResistance: number;
  totalResistance: {
    summer: number;
    winter: number;
  };
  uValue: {
    summer: number;
    winter: number;
  };
}

// Tab 5: ピロティ床マスタ (Piloti Floor Master)
export interface PilotiFloorMaster extends NamedEntity {
  floorType: string;
  layers: ConstructionLayer[];
  exteriorSurfaceResistance: {
    summer: number;
    winter: number;
  };
  interiorSurfaceResistance: number;
  totalResistance: {
    summer: number;
    winter: number;
  };
  uValue: {
    summer: number;
    winter: number;
  };
}

// Tab 6: 内壁マスタ (Interior Wall Master)
export interface InteriorWallMaster extends NamedEntity {
  wallType: string;
  layers: ConstructionLayer[];
  surfaceResistance: number;           // 表面熱伝達抵抗 [m²·K/W]
  totalResistance: number;             // 総熱抵抗 [m²·K/W] (calculated)
  uValue: number;                      // 熱貫流率 [W/(m²·K)] (calculated)
}

// Tab 7: 天井・床マスタ (Ceiling/Floor Master)
export interface CeilingFloorMaster extends NamedEntity {
  elementType: string;  // 'ceiling' or 'floor'
  layers: ConstructionLayer[];
  surfaceResistance: number;
  totalResistance: number;
  uValue: number;
}

// Tab 8: 地中壁マスタ (Underground Wall Master)
export interface UndergroundWallMaster extends NamedEntity {
  wallType: string;
  layers: ConstructionLayer[];
  interiorSurfaceResistance: number;
  totalResistance: number;             // 総熱抵抗 [m²·K/W] (calculated)
  uValue: number;                      // 熱貫流率 [W/(m²·K)] (calculated)
}

// Tab 9: 土間床マスタ (Earth Floor Master)
export interface EarthFloorMaster extends NamedEntity {
  floorType: string;
  layers: ConstructionLayer[];
  interiorSurfaceResistance: number;
  totalResistance: number;
  uValue: number;
}

// Union type for all envelope component types
export type EnvelopeComponentType =
  | 'overhang'
  | 'window'
  | 'exteriorWall'
  | 'roof'
  | 'pilotiFloor'
  | 'interiorWall'
  | 'ceilingFloor'
  | 'undergroundWall'
  | 'earthFloor';

// Combined type for all envelope master data
export interface EnvelopeMasterData {
  overhangs: OverhangMaster[];
  windowGlass: WindowGlassMaster[];
  exteriorWalls: ExteriorWallMaster[];
  roofs: RoofMaster[];
  pilotiFloors: PilotiFloorMaster[];
  interiorWalls: InteriorWallMaster[];
  ceilingFloors: CeilingFloorMaster[];
  undergroundWalls: UndergroundWallMaster[];
  earthFloors: EarthFloorMaster[];
  materials: MaterialMaster[];
}
