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

export default function RegionDataPage({ project }: Props) {
  const [data, setData] = useState<OutdoorRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegionData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/reference/design_outdoor_conditions`);
        // Response: { table_name, data: { metadata, records: [...] } }
        const tableData = res.data?.data;
        const records: OutdoorRecord[] = tableData?.records || [];
        const match = records.find(
          (r) => r.city === project.region
        );
        if (match) {
          setData(match);
        } else {
          setData(null);
          setError(`「${project.region}」の地区データが見つかりません。`);
        }
      } catch {
        setError("参照データの取得に失敗しました。バックエンドが起動しているか確認してください。");
      } finally {
        setLoading(false);
      }
    };
    if (project.region) fetchRegionData();
  }, [project.region]);

  // Build hourly table rows from the data
  const hourlyRows = data
    ? [
        {
          label: "乾球温度 [°C]",
          h9: data.temp_9_c,
          h12: data.temp_12_c,
          h14: data.temp_14_c,
          h16: data.temp_16_c,
          winter: data.heating_drybulb_c,
        },
        {
          label: "絶対湿度 [g/kg(DA)]",
          h9: data.abs_humidity_g_per_kgda,
          h12: data.abs_humidity_g_per_kgda,
          h14: data.abs_humidity_g_per_kgda,
          h16: data.abs_humidity_g_per_kgda,
          winter: undefined,
        },
        {
          label: "相対湿度 [%]",
          h9: data.cooling_rh_pct,
          h12: undefined,
          h14: undefined,
          h16: undefined,
          winter: undefined,
        },
        {
          label: "比エンタルピー [kJ/kg(DA)]",
          h9: data.enthalpy_kj_per_kgda,
          h12: undefined,
          h14: undefined,
          h16: undefined,
          winter: undefined,
        },
        {
          label: "湿球温度 [°C]",
          h9: data.wetbulb_c,
          h12: undefined,
          h14: undefined,
          h16: undefined,
          winter: undefined,
        },
      ]
    : [];

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

          {!loading && data && (
            <div className="space-y-6">
              {/* Summer / Winter peak conditions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Summer */}
                <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-200/60 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <CloudSun size={16} className="text-orange-500" />
                    <h4 className="text-sm font-semibold text-orange-800">夏期設計条件 (Summer)</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <DataCell label="乾球温度 (日最高)" value={data.daily_max_c} unit="°C" />
                    <DataCell label="冷房設計温度" value={data.cooling_drybulb_c} unit="°C" />
                    <DataCell label="最多風向" value={data.wind_dir} />
                    <DataCell label="湿球温度" value={data.wetbulb_c} unit="°C" />
                    <DataCell label="相対湿度" value={data.cooling_rh_pct} unit="%" />
                    <DataCell label="比エンタルピー" value={data.enthalpy_kj_per_kgda} unit="kJ/kg" />
                  </div>
                </div>

                {/* Winter */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50/50 border border-blue-200/60 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Snowflake size={16} className="text-blue-500" />
                    <h4 className="text-sm font-semibold text-blue-800">冬期設計条件 (Winter)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <DataCell label="暖房設計温度" value={data.heating_drybulb_c} unit="°C" />
                    <DataCell label="絶対湿度" value={data.abs_humidity_g_per_kgda} unit="g/kg" />
                  </div>
                </div>
              </div>

              {/* Hourly data table */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">設計用屋外条件 (各時刻)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-3 py-2 border border-slate-200 text-slate-600 font-medium">項目</th>
                        {["9時", "12時", "14時", "16時"].map((h) => (
                          <th key={h} className="text-right px-3 py-2 border border-slate-200 text-slate-600 font-medium bg-orange-50/50">
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

              {/* Raw data */}
              <details className="group">
                <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  生データを表示 (Raw JSON)
                </summary>
                <pre className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 overflow-auto max-h-60 border border-slate-200">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>
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
