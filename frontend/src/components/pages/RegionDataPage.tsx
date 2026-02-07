import { useEffect, useState } from "react";
import { MapPin, CloudSun, Snowflake, Loader2 } from "lucide-react";
import type { Project } from "../../types";
import api from "../../api/client";

interface Props {
  project: Project;
}

interface OutdoorRecord {
  city: string;
  cooling_drybulb_c?: number;
  daily_max_c?: number;
  temp_9_c?: number;
  temp_12_c?: number;
  temp_14_c?: number;
  temp_16_c?: number;
  wetbulb_c?: number;
  abs_humidity_g_per_kgda?: number;
  cooling_rh_pct?: number;
  enthalpy_kj_per_kgda?: number;
  max_monthly_c?: number;
  wind_dir?: string;
  heating_drybulb_c?: number;
  [key: string]: unknown;
}

interface SolarPosition {
  solar_altitude_deg: Record<string, number>;
  solar_azimuth_deg: Record<string, number>;
}

type OrientationTable = Record<string, Record<string, number>>;

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

const TABS = [
  { key: "outdoor", label: "設計用屋外条件", sublabel: "Outdoor" },
  { key: "solar_gain", label: "標準日射熱取得IG", sublabel: "Solar Gain" },
  { key: "solar_altitude", label: "太陽高度", sublabel: "Solar Altitude" },
  { key: "solar_azimuth", label: "太陽方位", sublabel: "Solar Azimuth" },
  { key: "apparent_solar", label: "見かけの太陽高度/方位角", sublabel: "Apparent" },
  { key: "etd", label: "実効温度差ETD", sublabel: "ETD" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function RegionDataPage({ project }: Props) {
  const [outdoorData, setOutdoorData] = useState<OutdoorRecord | null>(null);
  const [solarGainData, setSolarGainData] = useState<OrientationTable | null>(null);
  const [solarPositionData, setSolarPositionData] = useState<SolarPosition | null>(null);
  const [etdData, setEtdData] = useState<OrientationTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("outdoor");

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
        // Response: { table_name, data: { metadata, records: [...] } }
        const outdoorTableData = outdoorRes.data?.data;
        const outdoorRecords: OutdoorRecord[] = outdoorTableData?.records || [];
        const outdoorMatch = outdoorRecords.find((r) => r.city === project.region);
        setOutdoorData(outdoorMatch ?? null);

        const solarTable = solarRes.data?.data;
        setSolarGainData(solarTable?.regions?.[project.region] ?? null);
        setSolarPositionData(solarTable?.solar_position?.[project.region] ?? null);

        const etdTable = etdRes.data?.data;
        setEtdData(etdTable?.regions?.[project.region] ?? null);
      } catch {
        setError("参照データの取得に失敗しました。バックエンドが起動しているか確認してください。");
      } finally {
        setLoading(false);
      }
    };
    if (project.region) fetchRegionData();
  }, [project.region]);

  // Build hourly table rows from the data
  const hourlyRows = outdoorData
    ? [
        {
          label: "乾球温度 [°C]",
          h9: outdoorData.temp_9_c,
          h12: outdoorData.temp_12_c,
          h14: outdoorData.temp_14_c,
          h16: outdoorData.temp_16_c,
          winter: outdoorData.heating_drybulb_c,
        },
        {
          label: "絶対湿度 [g/kg(DA)]",
          h9: outdoorData.abs_humidity_g_per_kgda,
          h12: outdoorData.abs_humidity_g_per_kgda,
          h14: outdoorData.abs_humidity_g_per_kgda,
          h16: outdoorData.abs_humidity_g_per_kgda,
          winter: undefined,
        },
        {
          label: "相対湿度 [%]",
          h9: outdoorData.cooling_rh_pct,
          h12: undefined,
          h14: undefined,
          h16: undefined,
          winter: undefined,
        },
        {
          label: "比エンタルピー [kJ/kg(DA)]",
          h9: outdoorData.enthalpy_kj_per_kgda,
          h12: undefined,
          h14: undefined,
          h16: undefined,
          winter: undefined,
        },
        {
          label: "湿球温度 [°C]",
          h9: outdoorData.wetbulb_c,
          h12: undefined,
          h14: undefined,
          h16: undefined,
          winter: undefined,
        },
      ]
    : [];

  const orientationKeys = solarGainData
    ? ORIENTATION_ORDER.filter((key) => key in solarGainData)
    : etdData
      ? ORIENTATION_ORDER.filter((key) => key in etdData)
      : ORIENTATION_ORDER;

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
              設計条件ページで地域を変更できます。ここでは屋外設計条件を確認します。
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

              {activeTab === "outdoor" && (
                <div className="space-y-6">
                  {!outdoorData && (
                    <EmptyState message={`「${project.region}」の設計用屋外条件が見つかりません。`} />
                  )}

                  {outdoorData && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-200/60 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <CloudSun size={16} className="text-orange-500" />
                            <h4 className="text-sm font-semibold text-orange-800">夏期設計条件 (Summer)</h4>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <DataCell label="乾球温度 (日最高)" value={outdoorData.daily_max_c} unit="°C" />
                            <DataCell label="冷房設計温度" value={outdoorData.cooling_drybulb_c} unit="°C" />
                            <DataCell label="最多風向" value={outdoorData.wind_dir} />
                            <DataCell label="湿球温度" value={outdoorData.wetbulb_c} unit="°C" />
                            <DataCell label="相対湿度" value={outdoorData.cooling_rh_pct} unit="%" />
                            <DataCell label="比エンタルピー" value={outdoorData.enthalpy_kj_per_kgda} unit="kJ/kg" />
                          </div>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50/50 border border-blue-200/60 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <Snowflake size={16} className="text-blue-500" />
                            <h4 className="text-sm font-semibold text-blue-800">冬期設計条件 (Winter)</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <DataCell label="暖房設計温度" value={outdoorData.heating_drybulb_c} unit="°C" />
                            <DataCell label="絶対湿度" value={outdoorData.abs_humidity_g_per_kgda} unit="g/kg" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">設計用屋外条件 (各時刻)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="text-left px-3 py-2 border border-slate-200 text-slate-600 font-medium">項目</th>
                                {["9時", "12時", "14時", "16時"].map((h) => (
                                  <th
                                    key={h}
                                    className="text-right px-3 py-2 border border-slate-200 text-slate-600 font-medium bg-orange-50/50"
                                  >
                                    夏期 {h}
                                  </th>
                                ))}
                                <th className="text-right px-3 py-2 border border-slate-200 text-slate-600 font-medium bg-blue-50/50">
                                  冬期
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {hourlyRows.map((row) => (
                                <tr key={row.label} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-2 border border-slate-200 text-slate-700 font-medium">{row.label}</td>
                                  <td className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums">
                                    {row.h9 != null ? row.h9 : "—"}
                                  </td>
                                  <td className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums">
                                    {row.h12 != null ? row.h12 : "—"}
                                  </td>
                                  <td className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums">
                                    {row.h14 != null ? row.h14 : "—"}
                                  </td>
                                  <td className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums">
                                    {row.h16 != null ? row.h16 : "—"}
                                  </td>
                                  <td className="text-right px-3 py-2 border border-slate-200 text-slate-600 tabular-nums">
                                    {row.winter != null ? row.winter : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

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

              {activeTab === "solar_gain" && (
                <div className="space-y-4">
                  {!solarGainData && (
                    <EmptyState message={`「${project.region}」の標準日射熱取得IGが見つかりません。`} />
                  )}
                  {solarGainData && (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700">標準日射熱取得IG</h4>
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

              {activeTab === "solar_altitude" && (
                <div className="space-y-4">
                  {!solarPositionData && (
                    <EmptyState message={`「${project.region}」の太陽高度データが見つかりません。`} />
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

              {activeTab === "solar_azimuth" && (
                <div className="space-y-4">
                  {!solarPositionData && (
                    <EmptyState message={`「${project.region}」の太陽方位データが見つかりません。`} />
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

              {activeTab === "apparent_solar" && (
                <div className="space-y-6">
                  {!solarPositionData && (
                    <EmptyState message={`「${project.region}」の見かけの太陽高度/方位角を計算できません。`} />
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

              {activeTab === "etd" && (
                <div className="space-y-4">
                  {!etdData && <EmptyState message={`「${project.region}」の実効温度差ETDが見つかりません。`} />}
                  {etdData && (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700">実効温度差ETD</h4>
                        <span className="text-xs text-slate-400">単位: °C</span>
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
                                    {formatNumber(etdData[orientation]?.[slot], 0)}
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
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DataCell({ label, value, unit }: { label: string; value: unknown; unit?: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-slate-800 tabular-nums">
        {value != null ? String(value) : "—"}
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
  if (value == null) return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
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
