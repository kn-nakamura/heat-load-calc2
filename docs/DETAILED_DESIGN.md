# 熱負荷計算アプリケーション 詳細設計書

## 目次
1. [システム概要](#1-システム概要)
2. [アーキテクチャ](#2-アーキテクチャ)
3. [データモデル](#3-データモデル)
4. [画面設計](#4-画面設計)
5. [データフロー](#5-データフロー)
6. [実装優先順位](#6-実装優先順位)

---

## 1. システム概要

### 1.1 目的
建築物の熱負荷計算を行うWebアプリケーション。STABRO負荷計算R3と同等の機能を提供する。

### 1.2 基本コンセプト
```
┌─────────────┐
│ マスタデータ │
│             │
│ 1. 屋内データ│ ← 室用途別の標準値（温湿度、照明、人体、機器）
│ 2. 窓ガラス・ │ ← 建材の熱性能データ（窓、壁、屋根等）
│    構造体    │
└─────────────┘
       ↓ 参照
┌─────────────┐
│   室登録     │ ← 個別の室にマスタデータを適用
│             │
│ - 構造体     │ ← 窓ガラス・構造体マスタから選択
│ - 室内条件   │ ← 屋内データマスタから選択
│ - 計算条件   │
└─────────────┘
       ↓
┌─────────────┐
│   系統登録   │ ← 複数の室をグループ化
└─────────────┘
       ↓
┌─────────────┐
│   負荷確認   │ ← 計算結果の表示
└─────────────┘
```

### 1.3 技術スタック
- **フロントエンド**: React 18 + TypeScript
- **UI**: Material-UI (MUI) v5
- **状態管理**: Zustand
- **データ永続化**: IndexedDB (Dexie.js)
- **ビルドツール**: Vite

---

## 2. アーキテクチャ

### 2.1 フォルダ構成
```
src/
├── types/              # TypeScript型定義
│   ├── master.ts       # マスタデータ型
│   ├── room.ts         # 室データ型
│   └── system.ts       # 系統データ型
├── stores/             # Zustand状態管理
│   ├── masterStore.ts  # マスタデータストア
│   ├── roomStore.ts    # 室データストア
│   └── systemStore.ts  # 系統データストア
├── components/         # Reactコンポーネント
│   ├── layout/         # レイアウトコンポーネント
│   ├── pages/          # ページコンポーネント
│   │   ├── DesignConditionsPage.tsx
│   │   ├── DistrictDataPage.tsx
│   │   ├── IndoorDataPage.tsx          # ★重要
│   │   ├── EnvelopeStructurePage.tsx   # ★重要
│   │   ├── RoomRegistrationPage.tsx    # ★重要
│   │   ├── SystemRegistrationPage.tsx
│   │   └── LoadConfirmationPage.tsx
│   └── shared/         # 共通コンポーネント
├── db/                 # IndexedDB定義
│   └── database.ts
└── utils/              # ユーティリティ
```

### 2.2 コンポーネント階層
```
App
├── Sidebar (左サイドバー)
└── MainContent
    ├── DesignConditionsPage
    ├── DistrictDataPage
    ├── IndoorDataPage
    │   ├── IndoorConditionsTab
    │   ├── LightingTab
    │   ├── OccupancyTab
    │   ├── EquipmentTab
    │   └── NonAirConditionedTab
    ├── EnvelopeStructurePage
    │   ├── OverhangTab
    │   ├── WindowTab
    │   ├── ExteriorWallTab
    │   ├── RoofTab
    │   ├── PilotiFloorTab
    │   ├── InteriorWallTab
    │   ├── CeilingFloorTab
    │   ├── UndergroundWallTab
    │   └── EarthFloorTab
    ├── RoomRegistrationPage
    │   ├── RoomList (左側)
    │   └── RoomDetail (右側)
    │       ├── EnvelopeTab
    │       ├── IndoorConditionsTab
    │       ├── CalculationConditionsTab
    │       └── SystemNotesTab
    ├── SystemRegistrationPage
    └── LoadConfirmationPage
```

---

## 3. データモデル

### 3.1 マスタデータ型定義

#### 3.1.1 屋内データ - 設計用屋内条件
```typescript
// types/master.ts

/**
 * 設計用屋内条件マスタ（室タイプ別の温湿度条件）
 */
export interface IndoorConditionMaster {
  id: string;                    // 一意ID
  name: string;                  // 室名（例：一般事務室(1)、コンピュータ室）

  // 夏期条件
  summer: {
    dryBulbTemp: number;        // 乾球温度[℃]
    relativeHumidity: number;   // 相対湿度[%]
    absoluteHumidity: number;   // 絶対湿度[kg/kg(DA)]
    enthalpy: number;           // 比エンタルピー[kJ/kg(DA)]
    wetBulbTemp: number;        // 湿球温度[℃]
  };

  // 冬期条件
  winter: {
    dryBulbTemp: number;        // 乾球温度[℃]
    relativeHumidity: number;   // 相対湿度[%]
    absoluteHumidity: number;   // 絶対湿度[kg/kg(DA)]
    enthalpy: number;           // 比エンタルピー[kJ/kg(DA)]
    wetBulbTemp: number;        // 湿球温度[℃]
  };

  remarks: string;              // 備考
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.1.2 屋内データ - 照明器具の消費電力
```typescript
/**
 * 照明器具の消費電力マスタ（室用途別）
 */
export interface LightingPowerMaster {
  id: string;
  name: string;                          // 室名（例：事務室、上級室、設計室、製図室）
  designIlluminance: number;             // 設計照度[lx]

  // 各照明タイプの消費電力[W/m²]
  powerDensity: {
    fluorescentDownlight: number;        // 蛍光灯下面開放形消費電力
    fluorescentLouver: number;           // 蛍光灯ルーバー有消費電力
    fluorescentAcrylicCover: number;     // 蛍光灯アクリルカバー有消費電力
    ledDownlight: number;                // LED下面開放形消費電力
    ledLouver: number;                   // LEDルーバー有消費電力
  };

  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.1.3 屋内データ - 人体発熱量
```typescript
/**
 * 人体発熱量マスタ（室用途別）
 */
export interface OccupancyHeatMaster {
  id: string;
  name: string;                    // 室名（例：事務室(28℃)、会議室(28℃)）
  temperature: number;             // 想定温度[℃]
  occupantDensity: number;         // 人員密度[人/m²]
  latentHeat: number;              // 潜熱LH[W/人]
  sensibleHeat: number;            // 顕熱SH[W/人]
  densityRangeNote: string;        // 人員密度範囲備考（例：0.1〜0.2）
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.1.4 屋内データ - 事務機器・OA機器の消費電力
```typescript
/**
 * 事務機器・OA機器の消費電力マスタ（室用途別）
 */
export interface EquipmentPowerMaster {
  id: string;
  name: string;                    // 室名（例：会議室、上級室等）
  powerDensity: number;            // 消費電力[W/m²]
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.1.5 屋内データ - 非空調室差温度
```typescript
/**
 * 非空調室差温度マスタ（温度差パターン）
 */
export interface NonAirConditionedTempDiffMaster {
  id: string;
  name: string;                              // 非空調室名（例：一般、事務室/廊下/非空調）

  // 内外温度差式
  indoorOutdoorTempDiff: {
    summer: string;                          // 夏期（例：0.3 * (to - ti)）
    winter: string;                          // 冬期（例：0.3 * (ti - to)）
  };

  // 参考内外温度差Δt[℃]
  referenceTempDiff: {
    summerAt35ti26: number;                  // 夏期(to=35、ti=260時)
    winterAtMinus2ti22: number;              // 冬期(to=-2、ti=220時)
  };

  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 窓ガラス・構造体マスタ型定義

#### 3.2.1 ひさし
```typescript
/**
 * ひさしマスタ
 */
export interface OverhangMaster {
  id: string;
  code: string;                    // ひさし記号（例：E-1(県民ホール棟)）
  name: string;                    // ひさし名称

  // 寸法図情報
  diagram: string;                 // 寸法図の説明（例：ひさし＋左袖壁＋右袖壁）

  // 寸法[mm]
  dimensions: {
    b2Prime: number;               // b'2
    b: number;                     // b
    b1Prime: number;               // b'1
    H: number;                     // H
    h: number;                     // h
    hPrime: number;                // h'
    w: number;                     // w
    v2: number;                    // v2
    v1: number;                    // v1
  };

  // 日射簡単率SGを直接入力
  directSolarGainInput: boolean;
  solarGain: {
    hour9: number;
    hour12: number;
    hour14: number;
    hour16: number;
  } | null;

  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.2.2 窓ガラス
```typescript
/**
 * 材料マスタ（構成材料用）
 */
export interface MaterialMaster {
  id: string;
  code: number;                    // 材料コード（例：1183、1041）
  name: string;                    // 材料名（例：押出法ポリスチレン、コンクリート）
  category: string;                // カテゴリ（例：断熱材、構造材）
  defaultThermalConductivity: number;  // デフォルト熱伝導率[W/(m・K)]
  defaultThermalResistance: number;    // デフォルト熱抵抗[m²・K/W]
  imagePath: string;               // 材料図パス（例：pic16.bmp）
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 窓ガラスマスタ
 */
export interface WindowGlassMaster {
  id: string;
  code: string;                    // 窓ガラス記号（例：OG-01）
  name: string;                    // 窓ガラス名称

  // ガラス種類とブラインド種類
  glassType: {
    category: string;              // 番号
    glassTypeName: string;         // ガラス種類
    blindTypeName: string;         // ブラインド種類
  };

  // 遮入い係数と熱通過率
  shadingCoefficient: {
    sc: string;                    // 遮入い係数SC

    // 熱通過率K
    heatTransferCoeff: {
      summer: {
        type: string;              // 種類
        value: number;             // [W/(m²・K)]
      };
      winter: {
        type: string;
        value: number;
      };
    };
  };

  // 既定のひさし
  defaultOverhang: string | null;  // ひさし記号（nullの場合は「なし」）

  // イメージ図
  imagePath: string | null;

  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.2.3 外壁
```typescript
/**
 * 構成材料層
 */
export interface ConstructionLayer {
  layerNumber: number;             // 層番号（1〜12）
  materialCode: number | null;     // 材料コード（MaterialMaster.code）
  materialName: string;            // 材料名
  thickness: number;               // 厚さ[mm]
  thermalConductivity: number;     // 熱伝導率[W/(m・K)]
  thermalResistance: number;       // 熱抵抗[m²・K/W]
  imagePath: string;               // 材料図パス
}

/**
 * 外壁マスタ
 */
export interface ExteriorWallMaster {
  id: string;
  code: string;                    // 外壁記号（例：OW-01）
  name: string;                    // 外壁名称

  // イメージ図
  imagePath: string | null;

  // 構成材料（最大12層）
  constructionLayers: ConstructionLayer[];

  // 図方向
  orientation: 'vertical' | 'horizontal';  // 縦・横

  // 熱通過率
  heatTransfer: {
    // 外壁外表面熱伝達率αo [W/(m²・K)]
    exteriorSurfaceCoeff: {
      summer: number;
      winter: number;
    };

    // 室内表面熱伝達率αi [W/(m²・K)]
    interiorSurfaceCoeff: {
      summer: number;
      winter: number;
    };

    // 熱抵抗合計(1/αo + Σy + 1/αi) [m²・K/W]
    totalThermalResistance: {
      summer: number;
      winter: number;
    };

    // 熱通過率K [W/(m²・K)]
    uValue: {
      summer: number;
      winter: number;
    };

    // 熱通過率Kを直接入力
    directInput: boolean;
  };

  // ETD壁タイプ
  etdWallType: string;             // タイプI、II、III等のドロップダウン
  etdSelectionButton: boolean;     // 選定表...ボタンの有無

  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.2.4 屋根
```typescript
/**
 * 屋根マスタ（外壁とほぼ同じ構造）
 */
export interface RoofMaster {
  id: string;
  code: string;                    // 屋根記号（例：RW-01）
  name: string;
  imagePath: string | null;
  constructionLayers: ConstructionLayer[];
  orientation: 'vertical' | 'horizontal';
  heatTransfer: {
    exteriorSurfaceCoeff: { summer: number; winter: number; };
    interiorSurfaceCoeff: { summer: number; winter: number; };
    totalThermalResistance: { summer: number; winter: number; };
    uValue: { summer: number; winter: number; };
    directInput: boolean;
  };
  etdWallType: string;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.2.5 ピロティ床
```typescript
/**
 * ピロティ床マスタ
 */
export interface PilotiFloorMaster {
  id: string;
  code: string;                    // ピロティ床記号（例：OS-01 / ピロティ床）
  name: string;
  imagePath: string | null;
  constructionLayers: ConstructionLayer[];
  orientation: 'vertical' | 'horizontal';
  heatTransfer: {
    exteriorSurfaceCoeff: { summer: number; winter: number; };
    interiorSurfaceCoeff: { summer: number; winter: number; };
    totalThermalResistance: { summer: number; winter: number; };
    uValue: { summer: number; winter: number; };
    directInput: boolean;
  };
  etdWallType: string;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.2.6 内壁
```typescript
/**
 * 内壁マスタ
 */
export interface InteriorWallMaster {
  id: string;
  code: string;                    // 内壁記号（例：IW-01）
  name: string;
  imagePath: string | null;
  constructionLayers: ConstructionLayer[];
  orientation: 'vertical' | 'horizontal';

  // 熱通過率（内壁は室内⇔室内なので両側αi）
  heatTransfer: {
    // 室内表面熱伝達率αi(1) [W/(m²・K)]
    interiorSurfaceCoeff1: {
      summer: number;
      winter: number;
    };

    // 室内表面熱伝達率αi(2) [W/(m²・K)]
    interiorSurfaceCoeff2: {
      summer: number;
      winter: number;
    };

    // 熱抵抗合計(1/αi(1) + Σy + 1/αi(2)) [m²・K/W]
    totalThermalResistance: {
      summer: number;
      winter: number;
    };

    // 熱通過率K [W/(m²・K)]
    uValue: {
      summer: number;
      winter: number;
    };

    directInput: boolean;
  };

  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.2.7 天井・床
```typescript
/**
 * 天井・床マスタ
 */
export interface CeilingFloorMaster {
  id: string;
  code: string;                    // 天井・床記号（例：CF-01）
  name: string;
  imagePath: string | null;
  constructionLayers: ConstructionLayer[];
  orientation: 'vertical' | 'horizontal';

  // 熱通過率（天井・床は室内⇔室内なので両側αi）
  heatTransfer: {
    interiorSurfaceCoeff1: { summer: number; winter: number; };
    interiorSurfaceCoeff2: { summer: number; winter: number; };
    totalThermalResistance: { summer: number; winter: number; };
    uValue: { summer: number; winter: number; };
    directInput: boolean;
  };

  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.2.8 地中壁
```typescript
/**
 * 地中壁マスタ
 */
export interface UndergroundWallMaster {
  id: string;
  code: string;                    // 地中壁記号（例：GW-01）
  name: string;
  imagePath: string | null;
  constructionLayers: ConstructionLayer[];
  orientation: 'vertical' | 'horizontal';

  // 熱通過率（地中壁は室内⇔土壌）
  heatTransfer: {
    // 室内表面熱伝達率αi [W/(m²・K)]
    interiorSurfaceCoeff: {
      summer: number;
      winter: number;
    };

    // 熱抵抗合計(1/αi + Σy) [m²・K/W]
    totalThermalResistance: {
      summer: number;
      winter: number;
    };

    // 熱通過率K [W/(m²・K)]
    uValue: {
      summer: number;
      winter: number;
    };

    directInput: boolean;
  };

  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.2.9 土間床
```typescript
/**
 * 土間床マスタ
 */
export interface EarthFloorMaster {
  id: string;
  code: string;                    // 土間床記号（例：GF-01）
  name: string;
  imagePath: string | null;
  constructionLayers: ConstructionLayer[];
  orientation: 'vertical' | 'horizontal';

  // 熱通過率（土間床は室内⇔土壌）
  heatTransfer: {
    interiorSurfaceCoeff: { summer: number; winter: number; };
    totalThermalResistance: { summer: number; winter: number; };
    uValue: { summer: number; winter: number; };
    directInput: boolean;
  };

  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.3 室データ型定義

#### 3.3.1 室基本情報
```typescript
/**
 * 室データ
 */
export interface Room {
  id: string;
  floor: string;                   // 階（例：1FL、2FL、B1）
  roomNumber: string;              // 室番号（例：□174-e○）
  roomName: string;                // 室名

  // 基本情報
  floorAreaFormula: string;        // 床面積式[m²]
  floorArea: number;               // 床面積[m²]
  floorHeight: number;             // 階高[m]
  ceilingHeight: number;           // 天井高[m]
  roomVolume: number;              // 室容積[m³]
  roomCount: number;               // 室数

  // タブ別データ
  envelope: RoomEnvelope;          // 構造体タブ
  indoorConditions: RoomIndoorConditions;  // 室内条件タブ
  calculationConditions: RoomCalculationConditions;  // 計算条件タブ
  systemNotes: RoomSystemNotes;    // 系統・備考タブ

  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.3.2 室 - 構造体タブ
```typescript
/**
 * 構造体行データ
 */
export interface EnvelopeRow {
  rowNumber: number;               // 行番号
  orientation: string | null;      // 方位（N、NNE、水平、etc.）
  code: string | null;             // 記号（窓ガラス・構造体マスタのcode）
  codeType: 'overhang' | 'window' | 'exteriorWall' | 'roof' |
            'pilotiFloor' | 'interiorWall' | 'ceilingFloor' |
            'undergroundWall' | 'earthFloor' | null;  // 記号の種類
  width: number | null;            // 幅[m]
  height: number | null;           // 高さ(壁丈)[m]
  area: number | null;             // 面積[m²]
  overhangArea: number | null;     // 差し掛け面積[m²]
  totalArea: number;               // 合計[m²]
  overhangCode: string | null;     // ひさし記号
  nonAirConditionedDiff: string | null;  // 非空調室差
  undergroundDepth: string | null; // 地中深さ（例：1m、2m）
  remarks: string;                 // 備考
}

/**
 * 室 - 構造体タブデータ
 */
export interface RoomEnvelope {
  rows: EnvelopeRow[];             // 構造体行（可変長）
}
```

#### 3.3.3 室 - 室内条件タブ
```typescript
/**
 * 室 - 室内条件タブデータ
 */
export interface RoomIndoorConditions {
  // 設計用屋内条件
  designIndoorConditions: {
    referenceName: string | null;  // 参照室名（IndoorConditionMaster.name）
    // 選択されたマスタの値が自動表示される（readonlyとして扱う）
  };

  // 照明負荷
  lightingLoad: {
    referenceName: string | null;  // 参照室名（LightingPowerMaster.name）

    // 消費電力の算出
    calculation: {
      method: 'perUnit' | 'designIlluminance';  // 一台当たり / 設計照度

      // 一台当たりの場合
      perUnit?: {
        powerPerUnit: number;      // 消費電力[w]
        unitCount: number;         // 台数[台]
        format: string;            // 形式
      };

      // 設計照度の場合
      designIlluminance?: {
        illuminance: number;       // 設計照度[lx]
        powerDensity: number;      // 消費電力[W/m²]
        correctionFactor: number;  // 補正係数[lx]
      };

      // 共通
      correctedPower: number;      // 補正後消費電力[W/m²]
      correctionCoeff: number;     // 補正係数
      totalLoad: number;           // 総負荷[W/m²]
      totalLoadPerRoom: number;    // 総負荷[W/室]
    };
  };

  // 人体負荷
  occupancyLoad: {
    referenceName: string | null;  // 参照室名（OccupancyHeatMaster.name）
    occupantDensity: number;       // 人員密度[人/m²]
    occupantCount: number;         // 人員[人/室]（自動計算）
    latentHeat: number;            // 潜熱LH[W/人]
    sensibleHeat: number;          // 顕熱SH[W/人]
  };

  // 事務機器、OA機器
  equipmentLoad: {
    referenceName: string | null;  // 参照室名（EquipmentPowerMaster.name）
    powerDensity: number;          // 消費電力[W/m²]
    loadFactor: number;            // 負荷率
  };

  // その他の内部発熱負荷
  otherInternalLoad: {
    referenceName: string | null;  // 参照室名（EquipmentPowerMaster.name）
    powerDensity: number;          // 消費電力[W/m²]
    loadFactor: number;            // 負荷率
  };

  // 窓サッシ
  windowSash: {
    calculation: 'calculate' | 'none';  // 計算 / しない
    airVolume: number | null;      // 風量[m³/h]
  };

  // 外気負荷
  outdoorAirLoad: {
    // 人員による外気量
    perOccupant: {
      airVolumePerPerson: number;  // 一人当たり[m³/(h・人)]
      airVolumePerRoom: number;    // 室当たり[m³/h]（自動計算）
    };

    // 換気回数による外気量
    perAirChangeRate: {
      airChangeRate: number;       // 換気回数[回/h]
      airVolumePerRoom: number;    // 室当たり[m³/h]（自動計算）
    };

    // 必要外気量
    requiredAirVolume: number;     // [m³/h]

    // 設計外気量
    designAirVolume: {
      method: 'required' | 'manual';  // する / しない
      value: number;               // [m³/h]
      calculation: 'calculate' | 'none';  // 計算 / しない
    };

    // 全熱交換器
    totalHeatExchanger: {
      directInput: boolean;        // 直接入力
      airVolume: number | null;    // [m³/h]
      calculation: 'calculate' | 'none';
      efficiency: {
        summer: number;            // 熱交換効率夏期[%]
        winter: number;            // 熱交換効率冬期[%]
      } | null;
      temperatureEfficiency: number | null;  // 温度率[%]
    };
  };
}
```

#### 3.3.4 室 - 計算条件タブ
```typescript
/**
 * 室 - 計算条件タブデータ
 */
export interface RoomCalculationConditions {
  // 空調負荷区分
  airConditioningLoadCategory: {
    category: string;              // 空調負荷区分（ドロップダウン）
  };

  // 天井高・暖房設計用屋内温度補正
  ceilingHeightCorrection: {
    correctionCondition: string;   // 補正条件（ドロップダウン）
    correctionFactor: number;      // 補正係数Kc
  };

  // 顕熱負荷補正係数
  sensibleLoadCorrectionFactors: {
    // 冷房負荷
    cooling: {
      marginFactor: number;        // 余裕係数
      intermittentOperationFactor: number;  // 間欠運転係数
      fanLoadFactor: number;       // 送風機負荷係数
    };

    // 暖房負荷
    heating: {
      marginFactor: number;
      intermittentOperationFactor: number;
    };
  };

  // 方位係数
  orientationFactors: {
    // 16方位 + 日影 + 水平
    shade: number;
    horizontal: number;
    N: number;
    NNE: number;
    NE: number;
    ENE: number;
    E: number;
    ESE: number;
    SE: number;
    SSE: number;
    S: number;
    SSW: number;
    SW: number;
    WSW: number;
    W: number;
    WNW: number;
    NW: number;
    NNW: number;
  };

  // ブラインド条件
  blindConditions: {
    // 9時の開閉条件
    hour9: 'open' | 'closed' | 'conditional';

    // 12時、14時、16時の開閉条件
    hours12_14_16: 'open' | 'closed' | 'conditional';

    // 開いていると上限の日射熱取得量[W/m²](注)
    openUpperLimit: number;

    // 日射熱取得量と閉開閉
    solarGainThresholds: {
      threshold1: number;          // ※[G]P:
      condition1: string;          // 以下は開K
      threshold2: number;
      condition2: string;          // 以上は閉じる
    };
  };

  // 定期負荷の出算合法
  periodicLoadCalculation: {
    // (注)I建築設計標準計算書作成の手引』...の記載
    note: string;

    // 定期的な計算合算
    calculation: 'calculate' | 'none';

    // 照明負荷率
    lightingLoadRate: {
      enabled: boolean;            // しない / する
      rate: number | null;         // [%]
    };

    // 人体負荷率
    occupancyLoadRate: {
      enabled: boolean;
      rate: number | null;
    };

    // その他の内部発熱負荷率
    otherInternalLoadRate: {
      equipment: number | null;    // 機器[%]
      other: number | null;        // その他[%]
    };
  };

  // 負荷合併負荷条件
  loadCombinationConditions: {
    // 冷房負荷
    cooling: {
      method: string;              // ゼロ(0)にする（ドロップダウン）
    };

    // 暖房負荷
    heating: {
      method: string;
    };
  };
}
```

#### 3.3.5 室 - 系統・備考タブ
```typescript
/**
 * 室 - 系統・備考タブデータ
 */
export interface RoomSystemNotes {
  systemName: string | null;       // 系統名（ドロップダウンで系統リストから選択）
  remarks: string;                 // 備考
}
```

### 3.4 系統データ型定義

```typescript
/**
 * 系統データ
 */
export interface System {
  id: string;
  name: string;                    // 系統名（例：PAU-1、ACP-1-1）
  remarks: string;                 // 備考

  // 所属室の負荷集計区分
  loadAggregationCategory: {
    method: 'envelope_indoor_outdoor' |
            'envelope_indoorAndOutdoor' |
            'envelopeAndIndoor_outdoor' |
            'envelope_indoor_outdoor_separate';

    // 各集計方法に応じた集計結果
    summary: {
      floorArea: number;           // 床面積[m²]
      volume: number;              // 容積[m³]
      occupantCount: number;       // 人員[人]
      designOutdoorAir: number;    // 設計外気量[m³/h]
      rowCount: number;            // 室行数
      roomCount: number;           // 室数
    };
  };

  // 外皮方位の選択
  envelopeOrientationSelection: string;  // ボタンで選択ダイアログを開く

  // 所属室リスト
  rooms: {
    roomId: string;                // Room.id
    roomName: string;              // 室名
    floor: string;                 // 階
    floorArea: number;             // 床面積[m²]
    volume: number;                // 容積[m³]
    occupantCount: number;         // 人員[人]
    designOutdoorAir: number;      // 設計外気量[m³/h]
    roomCount: number;             // 室数
  }[];

  createdAt: Date;
  updatedAt: Date;
}
```

---

## 4. 画面設計

### 4.1 屋内データページ

#### 4.1.1 画面構成
```
┌────────────────────────────────────────────────┐
│ 屋内データ                                      │
├────────────────────────────────────────────────┤
│ [設計用屋内条件] [照明器具の消費電力] [人体発熱量] │
│ [事務機器・OA機器の消費電力] [非空調室差温度]   │
├────────────────────────────────────────────────┤
│                                                │
│ ■ 設計用屋内条件タブの内容：                   │
│                                                │
│ [新規作成] [削除] [ユーザーデータ登録...]       │
│                                                │
│ ┌────────────────────────────────────────┐    │
│ │ 室名                           │ 夏期  │ 冬期 │ │
│ │                               │乾球温度│乾球温度││
│ │                               │  [℃]  │ [℃]  ││
│ ├────────────────────────────────────────┤    │
│ │ 一般事務室(1)                  │ 28.0 │ 19.0 ││
│ │ 一般事務室(2)                  │ 26.0 │ 22.0 ││
│ │ コンピュータ室                 │ 24.0 │ 24.0 ││
│ │ ...                           │ ...  │ ...  ││
│ └────────────────────────────────────────┘    │
│                                                │
│ 選択された行の詳細編集フォーム                  │
│ ┌────────────────────────────────────────┐    │
│ │ 室名: [一般事務室(1)___________]          │    │
│ │                                          │    │
│ │ ■ 夏期                                   │    │
│ │ 乾球温度[℃]: [28.0]  相対湿度[%]: [45]   │    │
│ │ 絶対湿度[kg/kg(DA)]: [0.0107]           │    │
│ │ 比エンタルピー[kJ/kg(DA)]: [55.4]       │    │
│ │ 湿球温度[℃]: [22.2]                    │    │
│ │                                          │    │
│ │ ■ 冬期                                   │    │
│ │ 乾球温度[℃]: [19.0]  相対湿度[%]: [40]   │    │
│ │ ...                                      │    │
│ │                                          │    │
│ │ 備考: [___________________________]      │    │
│ └────────────────────────────────────────┘    │
└────────────────────────────────────────────────┘
```

#### 4.1.2 タブ構成

##### タブ1: 設計用屋内条件
- **上部ボタン**: [新規作成] [削除] [ユーザーデータ登録...]
- **テーブル**: 室名、夏期（乾球温度、相対湿度、絶対湿度、比エンタルピー、湿球温度）、冬期（同じ項目）、備考
- **編集フォーム**: 選択された行の詳細を編集

##### タブ2: 照明器具の消費電力
- **テーブル**: 室名、設計照度[lx]、蛍光灯下面開放形[W/m²]、蛍光灯ルーバー有[W/m²]、蛍光灯アクリルカバー有[W/m²]、LED下面開放形[W/m²]、LEDルーバー有[W/m²]、備考

##### タブ3: 人体発熱量
- **テーブル**: 室名、人員密度[人/m²]、潜熱LH[W/人]、顕熱SH[W/人]、備考

##### タブ4: 事務機器・OA機器の消費電力
- **テーブル**: 室名、消費電力[W/m²]、備考

##### タブ5: 非空調室差温度
- **テーブル**: 非空調室名、内外温度差式（夏期、冬期）、参考内外温度差Δt[℃]（夏期、冬期）、備考

#### 4.1.3 操作フロー

1. **新規作成ボタン**をクリック
   - テーブルに新しい行が追加される
   - 編集フォームがクリアされ、新規入力モードになる

2. **テーブルの行をクリック**
   - 選択された行のデータが編集フォームに表示される
   - フォームで値を変更すると、リアルタイムでテーブルの行も更新される

3. **削除ボタン**をクリック
   - 選択されている行が削除される（確認ダイアログ表示）

4. **ユーザーデータ登録...ボタン**
   - ユーザー定義のマスタデータをインポート/エクスポートする機能（将来実装）

### 4.2 窓ガラス・構造体ページ

#### 4.2.1 画面構成
```
┌────────────────────────────────────────────────────────────┐
│ 窓ガラス・構造体                                            │
├────────────────────────────────────────────────────────────┤
│ [ひさし] [窓ガラス] [外壁] [屋根] [ピロティ床]             │
│ [内壁] [天井・床] [地中壁] [土間床]                        │
├─────────────┬──────────────────────────────────────────┤
│ 左側：リスト  │ 右側：詳細                                │
│               │                                          │
│ 窓ガラス記号： │ 窓ガラス記号:                            │
│               │ [OG-01_________________] [新規作成]      │
│ ┌───────────┐│                                          │
│ │ 1  OG-01  ││ ガラス種類とブラインド種類:              │
│ │ 2  OG-02  ││ 番号: [___]  ガラス種類: [_______▼]    │
│ │    (県民ホ││           ブラインド種類: [_______▼]   │
│ │     ール) ││                                          │
│ │ 3  SCW1   ││ 遮入い係数と熱通過率:                    │
│ │    (県庁エ││ 遮入い係数SC: [___]                     │
│ │     ントラ││                                          │
│ │     ンス) ││ ┌────────────────────────────┐        │
│ │ 4  AWER-1 ││ │ ブラインド  夏期       冬期   │        │
│ │    (トップ││ │   なし   [W/(m²・K)] [W/(m²・K)]│      │
│ │     ライト││ │         種類▼  1.6     種類▼ 1.6│      │
│ │     北)   ││ │   0.43  ▼                     │        │
│ │ 5  AWER-2 ││ └────────────────────────────┘        │
│ │    (トップ││                                          │
│ │     ライト││ 既定のひさし: [(なし)_________▼]       │
│ │     南)   ││                                          │
│ │ 6  AW-1   ││ イメージ図:                             │
│ │    (一般) ││ ┌────────────────┐                    │
│ │ 7  AW-2   ││ │                    │                    │
│ │    (ブライ││ │    [窓ガラス図]    │                    │
│ │     ンド) ││ │                    │                    │
│ └───────────┘│ └────────────────┘                    │
│               │                                          │
│               │ 備考: [____________________________]     │
│               │                                          │
│               │ [ユーザーデータ読み込み...] [ユーザーデータ登録...]│
└─────────────┴──────────────────────────────────────────┘
```

#### 4.2.2 タブ構成

各タブ（ひさし、窓ガラス、外壁、屋根、ピロティ床、内壁、天井・床、地中壁、土間床）で共通の構造：

**左側（リスト）**:
- 記号の一覧（クリックで選択）
- 選択された記号がハイライト表示

**右側（詳細）**:
- 記号名入力
- [新規作成]ボタン、[ユーザーデータ読み込み...]ボタン、[ユーザーデータ登録...]ボタン
- 各部材タイプ固有の入力フォーム
- イメージ図表示エリア
- 備考入力

#### 4.2.3 外壁タブの詳細例

```
右側：外壁記号 OW-01 の詳細

外壁記号: [OW-01__________________] [新規作成]

イメージ図:
┌──────────┐
│            │
│    外      │
│    │      │
│  [断面図]  │
│    │      │
│    内      │
└──────────┘

構成材料:
┌────┬──────────┬────┬────────┬────────┬────┐
│番号│材料名        │厚さ│熱伝導率    │熱抵抗      │材料図│
│    │              │[mm]│[W/(m・K)]  │[m²・K/W]   │      │
├────┼──────────┼────┼────────┼────────┼────┤
│ 1  │押出法ポリスチ│50.0│ 0.028      │ 1.786      │▼pic16│
│    │レン▼        │    │            │            │      │
│ 2  │コンクリート▼│180.│ 1.600      │ 0.113      │▼pic06│
│ 3  │              │    │            │            │      │
│... │              │    │            │            │      │
│12  │              │    │            │            │      │
└────┴──────────┴────┴────────┴────────┴────┘

図方向: ○縦 ●横

熱通過率:
┌──────────────────────┬────┬────┐
│項目                        │夏期  │冬期  │
├──────────────────────┼────┼────┤
│外壁外表面熱伝達率αo [W/(m²・K)]│ 23   │ 23   │
│室内表面熱伝達率αi [W/(m²・K)]  │ 9    │ 9    │
│熱抵抗合計(1/αo + Σy + 1/αi)   │2.053 │2.053 │
│[m²・K/W]                   │      │      │
│熱通過率K [W/(m²・K)]       │ 0.5  │ 0.5  │
└──────────────────────┴────┴────┘
□ 熱通過率Kを直接入力

ETD壁タイプ: [タイプIII_______▼] [選定表...]

備考: [_______________________________________]
```

#### 4.2.4 操作フロー

1. **タブを選択**（例：窓ガラス）

2. **左側リストから記号をクリック**
   - 右側に選択された記号の詳細が表示される

3. **[新規作成]ボタンをクリック**
   - リストに新しい記号が追加される
   - 右側の詳細フォームがクリアされる
   - 記号名を入力し、詳細を設定する

4. **構成材料テーブルで材料を選択**
   - 材料名ドロップダウンをクリック
   - `MaterialMaster`から材料を選択
   - 選択された材料のデフォルト値（熱伝導率、熱抵抗）が自動入力される
   - 必要に応じて厚さや値を変更

5. **熱通過率が自動計算される**
   - 構成材料の値が変更されると、熱通過率が自動的に再計算される
   - 「熱通過率Kを直接入力」をチェックすると、手動入力モードになる

### 4.3 室登録ページ

#### 4.3.1 画面構成
```
┌──────────────────────────────────────────────────────────────┐
│ 室登録                                                         │
├──────┬───────────────────────────────────────────────────┤
│左側： │右側：室詳細                                            │
│リスト│                                                        │
│      │ ┌────────────────────────────────────────┐         │
│階 室番│ │階 室番号 室名                           │         │
│      │ │1FL □174-e○ ロビー1                     │         │
│┌────┤ └────────────────────────────────────────┘         │
││ 1FL │                                                        │
││ 1FL │ ■ 基本情報                                             │
││ 1FL │ 床面積式[m²]: [246.13] 床面積[m²]: 246.1              │
││ 1FL │ 階高[m]: 4.20  天井高[m]: 2.80                        │
││ 1FL │ 室容積[m³]: 689.1  室数: 1                            │
││ 1FL │                                                        │
││ 1FL │ [構造体] [室内条件] [計算条件] [系統・備考]            │
││ 2FL │                                                        │
││ 2FL │ ■ 構造体タブの内容：                                  │
││ 2FL │                                                        │
││...  │ ┌────┬────┬────┬────┬────┬────┬────┐        │
│└────┤ │方位│記号  │幅[m]│高さ│面積│合計│ひさし│        │
│      │ │    │      │    │[m] │[m²]│[m²]│記号  │        │
│      │ ├────┼────┼────┼────┼────┼────┼────┤        │
│      │ │ESE │EW4▼ │27.3│28.0│ 0.0│ 0.0│  ▼  │        │
│      │ │水平│GF-01▼│21.4│11.7│250.│250.│  ▼  │        │
│      │ │水平│CF-01▼│3.19│0.03│ 0.1│ 0.1│  ▼  │        │
│      │ │... │ ...  │... │... │... │... │ ...  │        │
│      │ └────┴────┴────┴────┴────┴────┴────┘        │
└──────┴───────────────────────────────────────────────────┘
```

#### 4.3.2 左側リスト

- **階ごとにグループ化**して表示
- 各行：`階` `室番号` `室名`
- クリックで選択、右側に詳細を表示
- 右クリックメニュー：[新規作成] [複製] [削除]

#### 4.3.3 右側詳細 - 構造体タブ

```
構造体タブ:

┌────┬────┬────┬────┬────┬──────┬────┬─────┬────────┬────┬────┐
│方位│記号  │幅[m]│高さ│面積│差し掛け│合計  │ひさし│非空調室差│地中│備考│
│  ▼│    ▼│    │[m] │[m²]│面積[m²]│[m²] │記号▼│      ▼  │深さ│    │
├────┼────┼────┼────┼────┼──────┼────┼─────┼────────┼────┼────┤
│ESE │EW4  │27.3│28.0│ 0.0│  0.0   │ 0.0 │      │          │    │    │
│水平│GF-01│21.4│11.7│250.│  0.0   │250. │      │          │1m  │    │
│水平│CF-01│3.19│0.03│ 0.1│  0.0   │ 0.1 │      │=一般     │    │    │
│水平│CF-01│10.6│0.19│ 2.0│  0.0   │ 2.0 │      │=一般     │    │    │
│水平│ER1a │3.95│0.12│ 0.5│  0.0   │ 0.5 │      │          │    │    │
│ESE │IW-01│    │    │17.0│  0.0   │17.0 │      │=一般     │    │    │
│水平│CF-01│2.90│0.04│ 0.1│  0.0   │ 0.1 │      │=一般     │    │    │
│ESE │SCW1 │    │    │70.9│  0.0   │70.9 │      │          │    │    │
│... │ ... │... │... │... │  ...   │ ... │ ...  │   ...    │... │... │
└────┴────┴────┴────┴────┴──────┴────┴─────┴────────┴────┴────┘

[行追加] [行削除] [行をコピー]
```

**操作フロー**:

1. **[行追加]ボタン**をクリック
   - 新しい行が追加される

2. **方位ドロップダウン**をクリック
   - 16方位 + 日影 + 水平から選択

3. **記号ドロップダウン**をクリック
   - 窓ガラス・構造体マスタの全記号（ひさし、窓ガラス、外壁、屋根、ピロティ床、内壁、天井・床、地中壁、土間床）から選択
   - 選択された記号に応じて、該当するマスタデータが参照される

4. **幅、高さを入力**
   - 面積が自動計算される（幅 × 高さ）
   - 合計 = 面積 + 差し掛け面積

5. **ひさし記号ドロップダウン**（窓ガラスの場合のみ有効）
   - ひさしマスタから選択

6. **非空調室差ドロップダウン**
   - 非空調室差温度マスタから選択

#### 4.3.4 右側詳細 - 室内条件タブ

```
室内条件タブ:

■ 設計用屋内条件
参照室名: [床輻射共用部_______________▼]

夏期:
  乾球温度: 27.0℃  相対湿度: 45%
  絶対湿度: 0.0100  比エンタルピー: 52.6
冬期:
  乾球温度: 20.0℃  相対湿度: 40%
  絶対湿度: 0.0058  比エンタルピー: 34.8

─────────────────────────────────────

■ 照明負荷
参照室名: [共用部_____________________▼]

消費電力の算出:
  ○ 一台当たり消費電力[w]、台数[台]、形式
  ● 設計照度形式

  一台当たり  台数  形式
  消費電力[w] [台]  [____________]
    [____]   [___]

  設計照度  消費電力  補正係数  補正    [W/m²] [W/室]
  [lx]     [W/m²]    [lx]
  LED関数形  3.0      1.00      3.0     738
    300

─────────────────────────────────────

■ 人体負荷
参照室名: [共用部_____________________▼]

人員密度[人/m²]: 0.05
人員[人/室]: 12  (自動計算)
潜熱LH[W/人]: 53
顕熱SH[W/人]: 69

─────────────────────────────────────

■ 事務機器、OA機器
（表示なし、「その他の内部発熱負荷」のみ）

■ その他の内部発熱負荷
参照室名: [その他居室_________________▼]

消費電力[W/m²]: 5
負荷率: 0.60

─────────────────────────────────────

■ 窓サッシ
すきま風負荷有: ○計算  ○しない
風量[m³/h]: [_______]

─────────────────────────────────────

■ 外気負荷

人員による外気量:
  一人当たり[m³/(h・人)]: 30
  室当たり[m³/h]: 360  (自動計算)

換気回数による外気量:
  換気回数[回/h]: [____]
  室当たり[m³/h]: [____] (自動計算)

必要外気量: 360 [m³/h]

設計外気量:
  ○する  ○しない
  [m³/h]: 360
  計算: ○する  ●しない

全熱交換器:
  □ 直接入力
  [m³/h]: [____]
  計算: [____▼]

  熱交換効率[%]:  夏期: [__]  冬期: [__]
  温度率[%]: [__]
```

**操作フロー**:

1. **参照室名ドロップダウンをクリック**
   - 該当するマスタ（設計用屋内条件、照明器具、人体発熱量、事務機器）から選択
   - 選択されたマスタのデータが自動的に下部に表示される（readonlyとして扱う、または編集可能にする場合は室固有の値としてコピー）

2. **照明負荷の算出方法を選択**
   - 「一台当たり」または「設計照度形式」をラジオボタンで選択
   - 選択に応じて入力フィールドが変わる

3. **外気負荷の計算**
   - 一人当たり外気量と床面積から「室当たり」を自動計算
   - 換気回数と室容積から「室当たり」を自動計算
   - 「必要外気量」は上記2つの大きい方が自動設定される

#### 4.3.5 右側詳細 - 計算条件タブ

```
計算条件タブ:

■ 空調負荷区分
空調負荷区分: [冷暖房負荷________________▼]

─────────────────────────────────────

■ 天井高・暖房設計用屋内温度補正
補正条件: [過大喚問補正______________▼]
補正係数Kc: 1.00

─────────────────────────────────────

■ 顕熱負荷補正係数

冷房負荷:
  余裕係数: 1.10  開ペ運転係数: 1.10  送風機負荷係数: 1.05

暖房負荷:
  余裕係数: 1.10  開ペ運転係数: 1.10

─────────────────────────────────────

■ 方位係数

日影  水平   N   NNE  NE  ENE   E   ESE  SE  SSE   S  SSW  SW  WSW   W  WNW  NW  NNW
1.20  1.20 1.10 1.10 1.10 1.10 1.10 1.10 1.05 1.10 1.05 1.05 1.10 1.10 1.10 1.10 1.10 1.10

─────────────────────────────────────

■ ブラインド条件

9時の開閉条件: [____▼]
12時、14時、16時の開閉条件: [____▼]

開いていると上限の日射熱取得量[W/m²](注): 116

※[G]P: 116  以下は開K
       117  以上は閉じる

(注)I建築設計標準計算書作成の手引』...必要に応じて変更してください

─────────────────────────────────────

■ 定期負荷の出算合法

定期的な計算合算: [計算▼]

照明負荷率[%]: ●しない  ○する [__]
人体負荷率[%]: (同じ)

その他の内部発熱負荷率:
  機器[%]: [__]  その他[%]: [__]

─────────────────────────────────────

■ 負荷合併負荷条件

冷房負荷: [ゼロ(0)にする______________▼]
暖房負荷: [ゼロ(0)にする______________▼]
```

#### 4.3.6 右側詳細 - 系統・備考タブ

```
系統・備考タブ:

系統: [PAU-5_______________________▼]

備考:
┌──────────────────────────────────────┐
│                                              │
│                                              │
│                                              │
│                                              │
└──────────────────────────────────────┘
```

### 4.4 系統登録ページ

#### 4.4.1 画面構成
```
┌──────────────────────────────────────────────────────┐
│ 系統登録                                                 │
├──────┬───────────────────────────────────────────┤
│左側： │右側：系統詳細                                      │
│ツリー│                                                    │
│      │ 系統詳細                                           │
│┌────┤                                                    │
││▼建物││ 名称: [PAU-1____________________]                │
││集計 ││                                                    │
││ │   ││ 備考: [______________________________]           │
││ ├PAU││                                                    │
││ │-1  ││ ─────────────────────────────────────         │
││ ├PAU││                                                    │
││ │-2  ││ ■ 所属室の負荷集計区分                          │
││ ├PAU││                                                    │
││ │-3  ││ ○ [外皮＋内部＋外気] 集計                      │
││ ├PAU││ ○ [外皮]、[内部＋外気] 集計                    │
││ │-4  ││ ● [外皮＋内部]、[外気] 集計                    │
││ ├PAU││ ○ [外皮]、[内部]、[外気] 集計                  │
││ │-5  ││                                                    │
││ ├PAU││ 床面積: 986.5 m²  容積: 2,762.1 m³              │
││ │-6  ││ 人員: 162人  設計外気量: 5,810 m³/h             │
││ ├HEU││ 室行数: 7行  室数: 7室                           │
││ │1FL ││                                                    │
││ ├HEU││ ─────────────────────────────────────         │
││ │2FL ││                                                    │
││ ├ACP││ [外皮方位の選択...]                              │
││ │-1-1││                                                    │
││ ... ││ ─────────────────────────────────────         │
│└────┤                                                    │
│      │ ■ 所属室                                           │
│      │                                                    │
│      │ ┌────┬──┬────┬────┬──┬────────┬────┐│
│      │ │室名  │階│床面積│容積  │人員│設計外気量  │室数││
│      │ │      │  │[m²] │[m³] │[人]│[m³/h]     │    ││
│      │ ├────┼──┼────┼────┼──┼────────┼────┤│
│      │ │[GS8..│1F│49.7 │139.2│ 7 │300         │ 1  ││
│      │ │[GS8..│1F│14.8 │41.4 │ 2 │90          │ 1  ││
│      │ │...   │..│...  │...  │.. │...         │... ││
│      │ └────┴──┴────┴────┴──┴────────┴────┘│
└──────┴───────────────────────────────────────────┘
```

#### 4.4.2 左側ツリー

- **階層構造**で系統を表示
- **建物集計**が最上位ノード
- その下に各系統（PAU-1、PAU-2、...）がツリー形式で並ぶ
- クリックで選択、右側に詳細を表示
- 右クリックメニュー：[新規作成] [複製] [削除]

#### 4.4.3 右側詳細

- **名称**: 系統名を入力
- **備考**: 自由記述
- **所属室の負荷集計区分**: ラジオボタンで選択
  - 選択に応じて集計結果（床面積、容積、人員、設計外気量、室行数、室数）が自動計算される
- **外皮方位の選択...ボタン**: ダイアログを開いて方位を選択（詳細は後述）
- **所属室テーブル**: 系統に属する室のリスト
  - 室をドラッグ&ドロップで追加、またはチェックボックスで選択

### 4.5 負荷確認ページ

```
負荷確認ページ:

最大負荷一覧表:
  負荷項目: [負荷合計 [W]▼]  期間: [夏期▼]

┌────────────────────────────────────────────────────┐
│名称                    │階│外皮＋内部│外皮│...│室数│
│                        │  │＋外気    │    │   │    │
├────────────────────────────────────────────────────┤
│▼建物集計               │  │735,360   │    │   │ 79 │
│  ▼PAU-1                │  │ 71,960   │    │   │  7 │
│    [GS8d2cd2-060d-4... │1F│  2,073   │    │   │  1 │
│    [GS8d2cd2-060d-4... │1F│    599   │    │   │  1 │
│    ...                 │..│   ...    │... │...│... │
│  ▼PAU-2                │  │ 73,557   │    │   │  7 │
│    ...                 │..│   ...    │... │...│... │
└────────────────────────────────────────────────────┘

─────────────────────────────────────────────────────

負荷詳細表: 建物集計【外皮＋内部＋外気負荷】

┌──────────────────────────────────────────────────┐
│                        │      夏期                     │
│負荷項目      │方位│記号│ 9時│12時│14時│16時│...│    │
│              │    │    │[W] │[W] │[W] │[W] │   │    │
├──────────────────────────────────────────────────┤
│室内負荷      │    │    │63,0│63,0│63,0│446,│...│... │
│              │    │    │73  │73  │73  │301 │   │    │
│単位負荷(室内)│    │    │... │... │... │... │...│... │
│[W/m²]       │    │    │    │    │    │    │   │    │
│外気負荷      │    │    │179,│169,│167,│... │...│... │
│              │    │    │070 │107 │413 │    │   │    │
│負荷合計      │    │    │242,│232,│230,│... │...│... │
│              │    │    │143 │180 │486 │    │   │    │
│単位負荷(合計)│    │    │ 72 │ 69 │ 73 │... │...│... │
│[W/m²]       │    │    │    │    │    │    │   │    │
└──────────────────────────────────────────────────┘
```

---

## 5. データフロー

### 5.1 マスタデータ → 室データのフロー

```
1. ユーザーが「屋内データ」で室タイプ別のマスタデータを登録
   ↓
2. ユーザーが「窓ガラス・構造体」で部材のマスタデータを登録
   ↓
3. ユーザーが「室登録」で新しい室を作成
   ↓
4. 構造体タブで「記号」ドロップダウンから部材マスタを選択
   → 選択された部材の熱性能データが参照される
   ↓
5. 室内条件タブで「参照室名」ドロップダウンから室タイプマスタを選択
   → 選択されたマスタの温湿度・照明・人体・機器データが自動表示される
   ↓
6. 計算条件タブで負荷計算のオプションを設定
   ↓
7. 系統・備考タブで系統を選択
   ↓
8. 「系統登録」で系統を作成し、室を系統に紐付ける
   ↓
9. 「負荷確認」で計算結果を確認
```

### 5.2 データの参照関係

```
IndoorConditionMaster (設計用屋内条件マスタ)
       ↓ (参照)
RoomIndoorConditions.designIndoorConditions.referenceName

LightingPowerMaster (照明器具マスタ)
       ↓ (参照)
RoomIndoorConditions.lightingLoad.referenceName

OccupancyHeatMaster (人体発熱量マスタ)
       ↓ (参照)
RoomIndoorConditions.occupancyLoad.referenceName

EquipmentPowerMaster (事務機器マスタ)
       ↓ (参照)
RoomIndoorConditions.equipmentLoad.referenceName
RoomIndoorConditions.otherInternalLoad.referenceName

─────────────────────────────────────

OverhangMaster (ひさしマスタ)
WindowGlassMaster (窓ガラスマスタ)
ExteriorWallMaster (外壁マスタ)
RoofMaster (屋根マスタ)
PilotiFloorMaster (ピロティ床マスタ)
InteriorWallMaster (内壁マスタ)
CeilingFloorMaster (天井・床マスタ)
UndergroundWallMaster (地中壁マスタ)
EarthFloorMaster (土間床マスタ)
       ↓ (参照)
RoomEnvelope.rows[].code

MaterialMaster (材料マスタ)
       ↓ (参照)
各構造体マスタ.constructionLayers[].materialCode

─────────────────────────────────────

Room (室データ)
       ↓ (参照)
System.rooms[].roomId
```

### 5.3 自動計算のフロー

#### 5.3.1 室内条件タブの自動計算

```
1. 参照室名を選択
   ↓
2. マスタデータから値を取得して表示

3. 床面積が変更される
   ↓
4. 照明負荷の「総負荷[W/室]」を再計算
   = 消費電力[W/m²] × 床面積[m²]

5. 人員密度が変更される
   ↓
6. 「人員[人/室]」を再計算
   = 人員密度[人/m²] × 床面積[m²]

7. 外気負荷の「一人当たり[m³/(h・人)]」が変更される
   ↓
8. 「室当たり[m³/h]」を再計算
   = 一人当たり × 人員[人/室]

9. 換気回数が変更される
   ↓
10. 「室当たり[m³/h]」を再計算
    = 換気回数[回/h] × 室容積[m³]

11. 「必要外気量」を再計算
    = max(人員による室当たり, 換気回数による室当たり)
```

#### 5.3.2 構造体タブの自動計算

```
1. 幅、高さを入力
   ↓
2. 面積を自動計算
   = 幅[m] × 高さ[m]

3. 差し掛け面積を入力
   ↓
4. 合計を自動計算
   = 面積 + 差し掛け面積
```

#### 5.3.3 窓ガラス・構造体の熱通過率自動計算

```
1. 構成材料テーブルで厚さや熱伝導率を変更
   ↓
2. 各層の熱抵抗を再計算
   = 厚さ[mm] / 1000 / 熱伝導率[W/(m・K)]

3. 熱抵抗合計を再計算
   = 1/αo + Σ(各層の熱抵抗) + 1/αi

4. 熱通過率Kを再計算
   = 1 / 熱抵抗合計

(「熱通過率Kを直接入力」がチェックされている場合は、手動入力値を優先)
```

---

## 6. 実装優先順位

### フェーズ1: 基盤構築
1. **プロジェクト初期化**
   - Vite + React + TypeScript + MUI セットアップ
   - フォルダ構成の作成
   - ESLint、Prettierの設定

2. **データモデル定義**
   - `types/`フォルダ内の全型定義を作成
   - IndexedDB スキーマ定義（Dexie.js）

3. **状態管理セットアップ**
   - Zustand ストアの作成（masterStore, roomStore, systemStore）
   - 基本的なCRUD操作の実装

4. **レイアウトコンポーネント**
   - サイドバー
   - メインコンテンツエリア
   - ページ遷移

### フェーズ2: マスタデータ管理
5. **屋内データページ**
   - タブ構造の実装
   - 設計用屋内条件タブ（テーブル + 編集フォーム）
   - 照明器具の消費電力タブ
   - 人体発熱量タブ
   - 事務機器・OA機器の消費電力タブ
   - 非空調室差温度タブ

6. **材料マスタ**
   - 材料マスタデータの登録
   - 材料選択ドロップダウンコンポーネント

7. **窓ガラス・構造体ページ（基本構造）**
   - タブ構造の実装
   - 左側リスト + 右側詳細のレイアウト
   - 窓ガラスタブ（簡易版）
   - 外壁タブ（構成材料テーブル + 熱通過率計算）

8. **窓ガラス・構造体ページ（全タブ）**
   - ひさしタブ
   - 屋根タブ
   - ピロティ床タブ
   - 内壁タブ
   - 天井・床タブ
   - 地中壁タブ
   - 土間床タブ

### フェーズ3: 室データ管理
9. **室登録ページ（基本情報）**
   - 左側リスト（階ごとグループ化）
   - 右側詳細（基本情報入力）
   - 室の追加・削除

10. **室登録ページ（構造体タブ）**
    - 構造体行テーブルの実装
    - 方位ドロップダウン
    - 記号ドロップダウン（窓ガラス・構造体マスタから選択）
    - 自動計算（面積、合計）

11. **室登録ページ（室内条件タブ）**
    - 設計用屋内条件（参照室名ドロップダウン + 自動表示）
    - 照明負荷（参照室名ドロップダウン + 消費電力算出）
    - 人体負荷（参照室名ドロップダウン + 自動計算）
    - その他内部発熱負荷
    - 窓サッシ
    - 外気負荷（自動計算）

12. **室登録ページ（計算条件タブ）**
    - 空調負荷区分
    - 顕熱負荷補正係数
    - 方位係数
    - ブラインド条件
    - 定期負荷の出算合法
    - 負荷合併負荷条件

13. **室登録ページ（系統・備考タブ）**
    - 系統選択ドロップダウン
    - 備考入力

### フェーズ4: 系統・負荷計算
14. **系統登録ページ**
    - 左側ツリー構造
    - 右側詳細（名称、備考、所属室の負荷集計区分）
    - 所属室テーブル
    - 集計結果の自動計算

15. **負荷計算エンジン**
    - 熱負荷計算アルゴリズムの実装
    - 時刻別負荷計算
    - 最大負荷の算出

16. **負荷確認ページ**
    - 最大負荷一覧表
    - 負荷詳細表
    - ドロップダウンによるフィルタリング（負荷項目、期間）

### フェーズ5: データ永続化・インポート/エクスポート
17. **IndexedDB との連携**
    - すべてのマスタデータ、室データ、系統データの保存
    - 自動保存機能

18. **データインポート/エクスポート**
    - JSON形式でのインポート/エクスポート
    - 「ユーザーデータ登録...」「ユーザーデータ読み込み...」機能

### フェーズ6: UI/UX改善・テスト
19. **UI改善**
    - STABROと同等のビジュアルデザイン
    - レスポンシブ対応

20. **バリデーション**
    - 入力値の検証
    - エラーメッセージ表示

21. **テスト**
    - ユニットテスト
    - E2Eテスト

22. **ドキュメント**
    - ユーザーマニュアル
    - 開発者ドキュメント

---

## 7. まとめ

この設計書では、STABROと同等の熱負荷計算アプリケーションを実現するための詳細な設計をまとめました。

### 主要な設計思想

1. **マスタデータ管理**
   - 屋内データ（室タイプ別の標準値）
   - 窓ガラス・構造体（部材の熱性能データ）
   - これらを「参照」する形で室データに適用

2. **データフロー**
   - マスタデータ → 室データ → 系統データ → 負荷計算結果
   - 各段階で自動計算を活用し、入力の手間を削減

3. **UI設計**
   - STABROのスクリーンショットを参考に、同等のレイアウトとUXを実現
   - 左側リスト + 右側詳細のパターンを多用
   - タブによる情報の整理

4. **実装の優先順位**
   - フェーズ1〜6に分けて段階的に実装
   - 早期に基盤を固め、後半でUI/UX改善に注力

この設計書に従って実装を進めることで、STABROと同等の機能を持つWebアプリケーションを構築できます。
