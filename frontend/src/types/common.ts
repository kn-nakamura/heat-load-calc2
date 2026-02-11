// Common types used across the application

export type Season = 'summer' | 'winter';

export type Orientation =
  | 'N' | 'NNE' | 'NE' | 'ENE'
  | 'E' | 'ESE' | 'SE' | 'SSE'
  | 'S' | 'SSW' | 'SW' | 'WSW'
  | 'W' | 'WNW' | 'NW' | 'NNW'
  | 'H' // Horizontal (roof)
  | null;

export interface PsychrometricCondition {
  dryBulbTemp: number;        // 乾球温度 [°C]
  relativeHumidity: number;   // 相対湿度 [%]
  absoluteHumidity: number;   // 絶対湿度 [kg/kg(DA)]
  enthalpy: number;           // エンタルピー [kJ/kg(DA)]
  wetBulbTemp: number;        // 湿球温度 [°C]
}

export interface SeasonalConditions {
  summer: PsychrometricCondition;
  winter: PsychrometricCondition;
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NamedEntity extends BaseEntity {
  name: string;
  remarks: string;
}
