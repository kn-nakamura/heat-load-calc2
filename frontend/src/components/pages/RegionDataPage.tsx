import { useEffect, useState } from "react";
import { MapPin, CloudSun, Snowflake, Loader2 } from "lucide-react";
import type { Project } from "../../types";
import api from "../../api/client";

interface Props {
  project: Project;
}

/* ---------- Outdoor conditions (new schema: hourly for ALL fields) ---------- */

interface OutdoorRecord {
  city: string;
  cooling_drybulb_daily_max_c?: number;
  cooling_drybulb_9_c?: number;
  cooling_drybulb_12_c?: number;
  cooling_drybulb_14_c?: number;
  cooling_drybulb_16_c?: number;
  cooling_wetbulb_daily_max_c?: number;
  cooling_wetbulb_9_c?: number;
  cooling_wetbulb_12_c?: number;
  cooling_wetbulb_14_c?: number;
  cooling_wetbulb_16_c?: number;
  cooling_abs_humidity_9_g_per_kgda?: number;
  cooling_abs_humidity_12_g_per_kgda?: number;
  cooling_abs_humidity_14_g_per_kgda?: number;
  cooling_abs_humidity_16_g_per_kgda?: number;
  cooling_rh_9_pct?: number;
  cooling_rh_12_pct?: number;
  cooling_rh_14_pct?: number;
  cooling_rh_16_pct?: number;
  cooling_enthalpy_9_kj_per_kgda?: number;
  cooling_enthalpy_12_kj_per_kgda?: number;
  cooling_enthalpy_14_kj_per_kgda?: number;
  cooling_enthalpy_16_kj_per_kgda?: number;
  max_monthly_mean_daily_max_c?: number;
  cooling_prevailing_wind_dir?: string;
  heating_drybulb_c?: number;
  heating_wetbulb_c?: number;
  heating_abs_humidity_g_per_kgda?: number;
  heating_rh_pct?: number;
  heating_enthalpy_kj_per_kgda?: number;
  min_monthly_mean_daily_min_c?: number;
  heating_prevailing_wind_dir?: string;
  [key: string]: unknown;
}

/* ---------- Solar data ---------- */

interface SolarPosition {
  solar_altitude_deg: Record<string, number>;
  solar_azimuth_deg: Record<string, number>;
}

type OrientationTable = Record<string, Record<string, number>>;

/* ---------- ETD data (new nested schema) ---------- */

interface EtdDirectionData {
  "9": number;
  "12": number;
  "14": number;
  "16": number;
}

interface EtdWallTypeData {
  "日陰": EtdDirectionData;
  "水平": EtdDirectionData;
  "方位別": Record<string, EtdDirectionData>;
}

type EtdIndoorTempData = Record<string, EtdWallTypeData>;
type EtdRegionData = Record<string, EtdIndoorTempData>;

/* ---------- Constants ---------- */

const TIME_SLOTS = ["9", "12", "14", "16"] as const;

const ORIENTATION_ORDER = [
  "水平",
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const;

const COMPASS_ORDER = [
  "N", "NNE", "NE", "ENE",
  "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW",
  "W", "WNW", "NW", "NNW",
] as const;

const SURFACE_AZIMUTH_DEG: Record<string, number | null> = {
  水平: null,
  N: 180,
  NNE: -157.5,
  NE: -135,
  ENE: -112.5,
  E: -90,
  ESE: -67.5,
  SE: -45,
  SSE: -22.5,
  S: 0,
  SSW: 22.5,
  SW: 45,
  WSW: 67.5,
  W: 90,
  WNW: 112.5,
  NW: 135,
  NNW: 157.5,
};

const WALL_TYPES = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ"] as const;

const TABS = [
  { key: "outdoor", label: "設計用外気条件", sublabel: "Outdoor" },
  { key: "solar_gain", label: "標準日射熱取得", sublabel: "Solar Gain" },
  { key: "solar_altitude", label: "太陽高度", sublabel: "Solar Altitude" },
  { key: "solar_azimuth", label: "太陽方位", sublabel: "Solar Azimuth" },
  { key: "apparent_solar", label: "見かけの太陽高度/方位角", sublabel: "Apparent" },
  { key: "etd", label: "相当外気温度差ETD", sublabel: "ETD" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ========================================================================== */

export default function RegionDataPage({ project }: Props) {
  const [outdoorData, setOutdoorData] = useState<OutdoorRecord | null>(null);
  const [solarGainData, setSolarGainData] = useState<OrientationTable | null>(null);
  const [solarPositionData, setSolarPositionData] = useState<SolarPosition | null>(null);
  const [etdRegionData, setEtdRegionData] = useState<EtdRegionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("outdoor");

  /* ETD selectors */
  const [etdWallType, setEtdWallType] = useState<string>("Ⅰ");
  const [etdIndoorTemp, setEtdIndoorTemp] = useState<string>("28");

  useEffect(() => {
    const fetchRegionData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [outdoorRes, solarRes, etdRes] = await Promise.all([
          api.get(`/reference/design_outdoor_conditions`),
          api.get(`/reference/standard_solar_gain`),
          api.get(`/reference/execution_temperature_difference`),
        ]);

        /* Outdoor conditions */
        const outdoorTableData = outdoorRes.data?.data;
        const outdoorRecords: OutdoorRecord[] = outdoorTableData?.records || [];
        const outdoorMatch = outdoorRecords.find((r) => r.city === project.region);
        setOutdoorData(outdoorMatch ?? null);

        /* Solar gain & position */
        const solarTable = solarRes.data?.data;
        setSolarGainData(solarTable?.regions?.[project.region] ?? null);
        setSolarPositionData(solarTable?.solar_position?.[project.region] ?? null);

        /* ETD (new nested structure) */
        const etdTable = etdRes.data?.data;
        const regionEtd = etdTable?.regions?.[project.region] ?? null;
        setEtdRegionData(regionEtd);

        /* Set default indoor temp to first available key */
        if (regionEtd) {
          const temps = Object.keys(regionEtd);
          if (temps.length > 0 && !temps.includes(etdIndoorTemp)) {
            setEtdIndoorTemp(temps[0]);
          }
        }
      } catch {
        setError("Failed to fetch region data. Please ensure the backend server is running.");
      } finally {
        setLoading(false);
      }
    };
    if (project.region) fetchRegionData();
  }, [project.region]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Outdoor conditions: build comprehensive table rows ---- */
  const outdoorHourlyRows = outdoorData
    ? [
        {
          label: "乾球温度 [°C]",
          dailyMax: outdoorData.cooling_drybulb_daily_max_c,
          h9: outdoorData.cooling_drybulb_9_c,
          h12: outdoorData.cooling_drybulb_12_c,
          h14: outdoorData.cooling_drybulb_14_c,
          h16: outdoorData.cooling_drybulb_16_c,
          winter: outdoorData.heating_drybulb_c,
        },
        {
          label: "湿球温度 [°C]",
          dailyMax: outdoorData.cooling_wetbulb_daily_max_c,
          h9: outdoorData.cooling_wetbulb_9_c,
          h12: outdoorData.cooling_wetbulb_12_c,
          h14: outdoorData.cooling_wetbulb_14_c,
          h16: outdoorData.cooling_wetbulb_16_c,
          winter: outdoorData.heating_wetbulb_c,
        },
        {
          label: "絶対湿度 [g/kg(DA)]",
          dailyMax: undefined,
          h9: outdoorData.cooling_abs_humidity_9_g_per_kgda,
          h12: outdoorData.cooling_abs_humidity_12_g_per_kgda,
          h14: outdoorData.cooling_abs_humidity_14_g_per_kgda,
          h16: outdoorData.cooling_abs_humidity_16_g_per_kgda,
          winter: outdoorData.heating_abs_humidity_g_per_kgda,
        },
        {
          label: "相対湿度 [%]",
          dailyMax: undefined,
          h9: outdoorData.cooling_rh_9_pct,
          h12: outdoorData.cooling_rh_12_pct,
          h14: outdoorData.cooling_rh_14_pct,
          h16: outdoorData.cooling_rh_16_pct,
          winter: outdoorData.heating_rh_pct,
        },
        {
          label: "比エンタルピー [kJ/kg(DA)]",
          dailyMax: undefined,
          h9: outdoorData.cooling_enthalpy_9_kj_per_kgda,
          h12: outdoorData.cooling_enthalpy_12_kj_per_kgda,
          h14: outdoorData.cooling_enthalpy_14_kj_per_kgda,
          h16: outdoorData.cooling_enthalpy_16_kj_per_kgda,
          winter: outdoorData.heating_enthalpy_kj_per_kgda,
        },
      ]
    : [];

  /* ---- ETD: resolve current selection ---- */
  const etdIndoorTempData: EtdIndoorTempData | null =
    etdRegionData?.[etdIndoorTemp] ?? null;
  const etdCurrentData: EtdWallTypeData | null =
    etdIndoorTempData?.[etdWallType] ?? null;
  const etdAvailableTemps = etdRegionData ? Object.keys(etdRegionData).sort() : [];
  const etdAvailableWallTypes = etdIndoorTempData
    ? WALL_TYPES.filter((wt) => wt in etdIndoorTempData)
    : [];

  /* ---- Solar / apparent solar orientation keys ---- */
  const orientationKeys = solarGainData
    ? ORIENTATION_ORDER.filter((key) => key in solarGainData)
    : ORIENTATION_ORDER;

  /* ============================== RENDER ============================== */

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <MapPin size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-slate-800">地区データ</h3>
          <span className="text-xs text-slate-400">Region Data</span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 border border-primary-200 rounded-xl">
              <MapPin size={16} className="text-primary-600" />
              <span className="text-sm font-medium text-primary-800">
                選択地域: {project.region}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              設計条件ページで地域を変更できます。ここでは外気設計条件を確認します。
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-primary-500 animate-spin" />
              <span className="ml-3 text-sm text-slate-500">データ読込中...</span>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          )}

          {!loading && (
            <div className="space-y-6">
              {/* ---- Tab bar ---- */}
              <div className="flex flex-wrap gap-2">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={[
                        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={[
                          "text-[11px] px-1.5 py-0.5 rounded-full",
                          isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                        ].join(" ")}
                      >
                        {tab.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ============================================================ */}
              {/* OUTDOOR CONDITIONS TAB                                       */}
              {/* ============================================================ */}
              {activeTab === "outdoor" && (
                <div className="space-y-6">
                  {!outdoorData && (
                    <EmptyState message={`${project.region} の設計用外気条件データが見つかりません。`} />
                  )}

                  {outdoorData && (
                    <>
                      {/* Summary cards */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-200/60 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <CloudSun size={16} className="text-orange-500" />
                            <h4 className="text-sm font-semibold text-orange-800">夏期設計条件 (Summer)</h4>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <DataCell label="最多風向" value={outdoorData.cooling_prevailing_wind_dir} />
                            <DataCell label="月平均日最高気温の最大" value={outdoorData.max_monthly_mean_daily_max_c} unit="°C" />
                          </div>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50/50 border border-blue-200/60 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <Snowflake size={16} className="text-blue-500" />
                            <h4 className="text-sm font-semibold text-blue-800">冬期設計条件 (Winter)</h4>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <DataCell label="最多風向" value={outdoorData.heating_prevailing_wind_dir} />
                            <DataCell label="月平均日最低気温の最小" value={outdoorData.min_monthly_mean_daily_min_c} unit="°C" />
                          </div>
                        </div>
                      </div>

                      {/* Comprehensive hourly table */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">
                          設計用外気条件 (各時刻)
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th
                                  rowSpan={2}
                                  className="text-left px-3 py-2 border border-slate-200 text-slate-600 font-medium align-bottom"
                                >
                                  項目
                                </th>
                                <th
                                  colSpan={5}
                                  className="text-center px-3 py-2 border border-slate-200 text-orange-700 font-medium bg-orange-50/50"
                                >
                                  夏期
                                </th>
                                <th
                                  rowSpan={2}
                                  className="text-center px-3 py-2 border border-slate-200 text-blue-700 font-medium bg-blue-50/50 align-bottom"
                                >
                                  冬期
                                </th>
                              </tr>
                              <tr className="bg-slate-50">
                                <th className="text-right px-3 py-2 border border-slate-200 text-slate-600 font-medium bg-orange-50/50">
                                  日最高
                                </th>
                                {["9時", "12時", "14時", "16時"].map((h) => (
                                  <th
                                    key={h}
                                    className="text-right px-3 py-2 border border-slate-200 text-slate-600 font-medium bg-orange-50/50"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {outdoorHourlyRows.map((row) => (
                                <tr key={row.label} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-2 border border-slate-200 text-slate-700 font-medium whitespace-nowrap">
                                    {row.label}
                                  </td>
                                  <td className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums">
                                    {row.dailyMax != null ? row.dailyMax : "-"}
                                  </td>
                                  <td className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums">
                                    {row.h9 != null ? row.h9 : "-"}
                                  </td>
                                  <td className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums">
                                    {row.h12 != null ? row.h12 : "-"}
                                  </td>
                                  <td className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums">
                                    {row.h14 != null ? row.h14 : "-"}
                                  </td>
                                  <td className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums">
                                    {row.h16 != null ? row.h16 : "-"}
                                  </td>
                                  <td className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums bg-blue-50/20">
                                    {row.winter != null ? row.winter : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Raw JSON accordion */}
                      <details className="group">
                        <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 transition-colors">
                          生データを表示 (Raw JSON)
                        </summary>
                        <pre className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 overflow-auto max-h-60 border border-slate-200">
                          {JSON.stringify(outdoorData, null, 2)}
                        </pre>
                      </details>
                    </>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* SOLAR GAIN TAB (unchanged)                                   */}
              {/* ============================================================ */}
              {activeTab === "solar_gain" && (
                <div className="space-y-4">
                  {!solarGainData && (
                    <EmptyState message={`${project.region} の標準日射熱取得データが見つかりません。`} />
                  )}
                  {solarGainData && (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700">標準日射熱取得</h4>
                        <span className="text-xs text-slate-400">単位: W/m²</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="text-left px-3 py-2 border border-slate-200 text-slate-600 font-medium">方位</th>
                              {TIME_SLOTS.map((h) => (
                                <th key={h} className="text-right px-3 py-2 border border-slate-200 text-slate-600 font-medium">
                                  {h}時
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {orientationKeys.map((orientation) => (
                              <tr key={orientation} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2 border border-slate-200 text-slate-700 font-medium">{orientation}</td>
                                {TIME_SLOTS.map((slot) => (
                                  <td
                                    key={`${orientation}-${slot}`}
                                    className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums"
                                  >
                                    {formatNumber(solarGainData[orientation]?.[slot], 0)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* SOLAR ALTITUDE TAB (unchanged)                               */}
              {/* ============================================================ */}
              {activeTab === "solar_altitude" && (
                <div className="space-y-4">
                  {!solarPositionData && (
                    <EmptyState message={`${project.region} の太陽高度データが見つかりません。`} />
                  )}
                  {solarPositionData && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left px-3 py-2 border border-slate-200 text-slate-600 font-medium">項目</th>
                            {TIME_SLOTS.map((h) => (
                              <th key={h} className="text-right px-3 py-2 border border-slate-200 text-slate-600 font-medium">
                                {h}時
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 border border-slate-200 text-slate-700 font-medium">太陽高度 [deg]</td>
                            {TIME_SLOTS.map((slot) => (
                              <td
                                key={`alt-${slot}`}
                                className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums"
                              >
                                {formatNumber(solarPositionData.solar_altitude_deg?.[slot], 1)}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* SOLAR AZIMUTH TAB (unchanged)                                */}
              {/* ============================================================ */}
              {activeTab === "solar_azimuth" && (
                <div className="space-y-4">
                  {!solarPositionData && (
                    <EmptyState message={`${project.region} の太陽方位データが見つかりません。`} />
                  )}
                  {solarPositionData && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left px-3 py-2 border border-slate-200 text-slate-600 font-medium">項目</th>
                            {TIME_SLOTS.map((h) => (
                              <th key={h} className="text-right px-3 py-2 border border-slate-200 text-slate-600 font-medium">
                                {h}時
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 border border-slate-200 text-slate-700 font-medium">太陽方位 [deg]</td>
                            {TIME_SLOTS.map((slot) => (
                              <td
                                key={`az-${slot}`}
                                className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums"
                              >
                                {formatNumber(solarPositionData.solar_azimuth_deg?.[slot], 1)}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* APPARENT SOLAR TAB (unchanged)                               */}
              {/* ============================================================ */}
              {activeTab === "apparent_solar" && (
                <div className="space-y-6">
                  {!solarPositionData && (
                    <EmptyState message={`${project.region} の見かけの太陽位置を計算できません。`} />
                  )}
                  {solarPositionData && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-700">見かけの太陽高度</h4>
                          <span className="text-xs text-slate-400">単位: deg</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="text-left px-3 py-2 border border-slate-200 text-slate-600 font-medium">方位</th>
                                {TIME_SLOTS.map((h) => (
                                  <th key={h} className="text-right px-3 py-2 border border-slate-200 text-slate-600 font-medium">
                                    {h}時
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {orientationKeys.map((orientation) => (
                                <tr key={`app-alt-${orientation}`} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-2 border border-slate-200 text-slate-700 font-medium">{orientation}</td>
                                  {TIME_SLOTS.map((slot) => {
                                    const apparent = getApparentSolarPosition(
                                      orientation,
                                      slot,
                                      solarPositionData
                                    );
                                    return (
                                      <td
                                        key={`app-alt-${orientation}-${slot}`}
                                        className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums"
                                      >
                                        {formatNumber(apparent?.altitude, 1)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-700">見かけの太陽方位角</h4>
                          <span className="text-xs text-slate-400">単位: deg</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="text-left px-3 py-2 border border-slate-200 text-slate-600 font-medium">方位</th>
                                {TIME_SLOTS.map((h) => (
                                  <th key={h} className="text-right px-3 py-2 border border-slate-200 text-slate-600 font-medium">
                                    {h}時
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {orientationKeys.map((orientation) => (
                                <tr key={`app-az-${orientation}`} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-2 border border-slate-200 text-slate-700 font-medium">{orientation}</td>
                                  {TIME_SLOTS.map((slot) => {
                                    const apparent = getApparentSolarPosition(
                                      orientation,
                                      slot,
                                      solarPositionData
                                    );
                                    return (
                                      <td
                                        key={`app-az-${orientation}-${slot}`}
                                        className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums"
                                      >
                                        {formatNumber(apparent?.azimuth, 1)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* ETD TAB (rewritten for nested structure)                     */}
              {/* ============================================================ */}
              {activeTab === "etd" && (
                <div className="space-y-4">
                  {!etdRegionData && (
                    <EmptyState message={`${project.region} の相当外気温度差ETDデータが見つかりません。`} />
                  )}
                  {etdRegionData && (
                    <>
                      {/* Selectors row */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-slate-700">室温:</label>
                          <select
                            value={etdIndoorTemp}
                            onChange={(e) => setEtdIndoorTemp(e.target.value)}
                            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            {etdAvailableTemps.map((t) => (
                              <option key={t} value={t}>
                                {t}°C
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-slate-700">壁体タイプ:</label>
                          <div className="flex gap-1">
                            {etdAvailableWallTypes.map((wt) => {
                              const isSelected = etdWallType === wt;
                              return (
                                <button
                                  key={wt}
                                  type="button"
                                  onClick={() => setEtdWallType(wt)}
                                  className={[
                                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                    isSelected
                                      ? "bg-primary-600 text-white shadow-sm"
                                      : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50",
                                  ].join(" ")}
                                >
                                  {wt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 ml-auto">単位: °C</span>
                      </div>

                      {/* ETD table */}
                      {!etdCurrentData && (
                        <EmptyState
                          message={`壁体タイプ ${etdWallType} / 室温 ${etdIndoorTemp}°C のETDデータが見つかりません。`}
                        />
                      )}
                      {etdCurrentData && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="text-left px-3 py-2 border border-slate-200 text-slate-600 font-medium">
                                  方位
                                </th>
                                {TIME_SLOTS.map((h) => (
                                  <th
                                    key={h}
                                    className="text-right px-3 py-2 border border-slate-200 text-slate-600 font-medium"
                                  >
                                    {h}時
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {/* 日陰 (shade) row */}
                              <tr className="hover:bg-slate-50/50 bg-slate-50/30">
                                <td className="px-3 py-2 border border-slate-200 text-slate-700 font-medium">
                                  日陰
                                </td>
                                {TIME_SLOTS.map((slot) => (
                                  <td
                                    key={`shade-${slot}`}
                                    className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums"
                                  >
                                    {formatNumber(
                                      (etdCurrentData["日陰"] as EtdDirectionData)?.[slot],
                                      1
                                    )}
                                  </td>
                                ))}
                              </tr>
                              {/* 水平 (horizontal) row */}
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-3 py-2 border border-slate-200 text-slate-700 font-medium">
                                  水平
                                </td>
                                {TIME_SLOTS.map((slot) => (
                                  <td
                                    key={`horiz-${slot}`}
                                    className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums"
                                  >
                                    {formatNumber(
                                      (etdCurrentData["水平"] as EtdDirectionData)?.[slot],
                                      1
                                    )}
                                  </td>
                                ))}
                              </tr>
                              {/* Compass direction rows from 方位別 */}
                              {COMPASS_ORDER.map((dir) => {
                                const dirData = etdCurrentData["方位別"]?.[dir];
                                if (!dirData) return null;
                                return (
                                  <tr key={dir} className="hover:bg-slate-50/50">
                                    <td className="px-3 py-2 border border-slate-200 text-slate-700 font-medium">
                                      {dir}
                                    </td>
                                    {TIME_SLOTS.map((slot) => (
                                      <td
                                        key={`${dir}-${slot}`}
                                        className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums"
                                      >
                                        {formatNumber(dirData[slot], 1)}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ========================================================================== */
/* Helper components & functions                                              */
/* ========================================================================== */

function DataCell({ label, value, unit }: { label: string; value: unknown; unit?: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-slate-800 tabular-nums">
        {value != null ? String(value) : "-"}
        {unit && value != null && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
      {message}
    </div>
  );
}

function formatNumber(value: unknown, digits: number) {
  if (value == null) return "-";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return digits === 0 ? Math.round(numeric).toString() : numeric.toFixed(digits);
}

function getApparentSolarPosition(
  orientation: string,
  timeSlot: string,
  solarPosition: SolarPosition
) {
  const altitude = solarPosition.solar_altitude_deg?.[timeSlot];
  const azimuth = solarPosition.solar_azimuth_deg?.[timeSlot];
  if (altitude == null || azimuth == null) {
    return null;
  }
  const surfaceAzimuth = SURFACE_AZIMUTH_DEG[orientation];
  if (surfaceAzimuth == null) {
    return { altitude, azimuth };
  }
  const altRad = (altitude * Math.PI) / 180;
  const deltaRad = ((azimuth - surfaceAzimuth) * Math.PI) / 180;
  const apparentAltitude = (Math.atan2(Math.tan(altRad), Math.cos(deltaRad)) * 180) / Math.PI;
  const apparentAzimuth = (Math.atan2(Math.sin(deltaRad), Math.tan(altRad)) * 180) / Math.PI;
  return { altitude: apparentAltitude, azimuth: apparentAzimuth };
}
