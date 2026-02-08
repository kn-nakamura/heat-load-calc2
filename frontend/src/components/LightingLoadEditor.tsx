import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import api from "../api/client";
import type { InternalLoad, Project } from "../types";

interface Props {
  project: Project;
  rows: InternalLoad[];
  onChange: (rows: InternalLoad[]) => void;
}

interface LightingRecord {
  design_illuminance_lux: number;
  lighting_type: string;
  lighting_subtype: string;
  room_examples: string;
  power_w_per_m2: number;
  work_no: number;
}

/** Column key derived from lighting_type + lighting_subtype */
type ColKey =
  | "蛍光灯_下面開放形"
  | "蛍光灯_ルーパー有"
  | "蛍光灯_アクリルカバー有"
  | "LED_下面開放形"
  | "LED_ルーパー有";

const COL_DEFS: { key: ColKey; label: string; sub: string }[] = [
  { key: "蛍光灯_下面開放形", label: "蛍光灯", sub: "下面開放形" },
  { key: "蛍光灯_ルーパー有", label: "蛍光灯", sub: "ルーパー有" },
  { key: "蛍光灯_アクリルカバー有", label: "蛍光灯", sub: "アクリルカバー有" },
  { key: "LED_下面開放形", label: "LED", sub: "下面開放形" },
  { key: "LED_ルーパー有", label: "LED", sub: "ルーパー有" },
];

interface GroupedRow {
  roomExamples: string;
  illuminanceLux: number;
  powers: Partial<Record<ColKey, number>>;
}

function buildColKey(type: string, subtype: string): ColKey | null {
  const k = `${type}_${subtype}` as ColKey;
  if (COL_DEFS.some((c) => c.key === k)) return k;
  return null;
}

export default function LightingLoadEditor({ project, rows, onChange }: Props) {
  const [records, setRecords] = useState<LightingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Fetch reference data ------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get("/reference/lighting_power_density")
      .then((res) => {
        if (cancelled) return;
        const fetched = (res.data as { data: { records: LightingRecord[] } }).data.records;
        setRecords(fetched);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch lighting reference data", err);
        setError("照明基準データの取得に失敗しました。");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Group records by room_examples --------------------------------------
  const grouped = useMemo<GroupedRow[]>(() => {
    const map = new Map<string, GroupedRow>();
    const order: string[] = [];

    for (const rec of records) {
      let row = map.get(rec.room_examples);
      if (!row) {
        row = {
          roomExamples: rec.room_examples,
          illuminanceLux: rec.design_illuminance_lux,
          powers: {},
        };
        map.set(rec.room_examples, row);
        order.push(rec.room_examples);
      }
      const colKey = buildColKey(rec.lighting_type, rec.lighting_subtype);
      if (colKey) {
        row.powers[colKey] = rec.power_w_per_m2;
      }
    }

    return order.map((k) => map.get(k)!);
  }, [records]);

  // ---- Room area map for user rows -----------------------------------------
  const roomAreaMap = useMemo(() => {
    const m: Record<string, number> = {};
    project.rooms.forEach((r) => {
      m[r.id] = r.area_m2;
    });
    return m;
  }, [project.rooms]);

  // ---- User custom row handlers --------------------------------------------
  const handleAddRow = () => {
    onChange([
      ...rows,
      {
        id: `qE_${rows.length + 1}`,
        room_id: "",
        kind: "lighting",
        sensible_w: 0,
        latent_w: 0,
        illuminance_lux: 500,
        power_density_w_m2: 5,
      },
    ]);
  };

  const handleDeleteRow = (idx: number) => {
    onChange(rows.filter((_, i) => i !== idx));
  };

  const handleUserRowChange = (
    idx: number,
    field: keyof InternalLoad,
    raw: string
  ) => {
    const next = rows.map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r, [field]: raw };

      // Parse numeric fields
      if (
        field === "illuminance_lux" ||
        field === "power_density_w_m2" ||
        field === "sensible_w" ||
        field === "latent_w"
      ) {
        const num = Number(raw);
        (updated as Record<string, unknown>)[field] = Number.isFinite(num)
          ? num
          : undefined;
      }

      // Auto-calculate sensible_w when power_density changes
      if (field === "power_density_w_m2" || field === "room_id") {
        const pd = updated.power_density_w_m2;
        const area = roomAreaMap[updated.room_id];
        if (pd && area) {
          updated.sensible_w = Math.round(area * pd);
        }
      }

      return updated;
    });
    onChange(next);
  };

  // ---- Render --------------------------------------------------------------

  /** Shared cell style for the reference table */
  const cellCls =
    "px-3 py-1.5 text-xs text-slate-700 border border-slate-200 whitespace-nowrap";
  const headerCls =
    "px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 whitespace-nowrap text-center";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            照明発熱基準表
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            室用途ごとの照明消費電力密度の基準値を表示します。
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
          >
            <Plus size={14} /> 行追加
          </button>
        </div>
      </div>

      {/* Reference table */}
      <div className="overflow-x-auto">
        {loading && (
          <p className="px-5 py-4 text-xs text-slate-400">読み込み中...</p>
        )}
        {error && (
          <p className="px-5 py-4 text-xs text-red-500">{error}</p>
        )}
        {!loading && !error && (
          <table className="w-full border-collapse text-left">
            <thead>
              {/* Top header row: spans */}
              <tr>
                <th rowSpan={2} className={headerCls}>
                  No.
                </th>
                <th rowSpan={2} className={headerCls}>
                  室名
                </th>
                <th rowSpan={2} className={headerCls}>
                  設計照度
                  <br />
                  [lx]
                </th>
                {/* Group: 蛍光灯 */}
                <th colSpan={3} className={headerCls}>
                  蛍光灯 消費電力 [W/m&sup2;]
                </th>
                {/* Group: LED */}
                <th
                  colSpan={2}
                  className={headerCls}
                >
                  LED 消費電力 [W/m&sup2;]
                </th>
                <th rowSpan={2} className={headerCls}>
                  備考
                </th>
              </tr>

              {/* Sub-header row */}
              <tr>
                <th className={headerCls}>下面開放形</th>
                <th className={headerCls}>ルーパー有</th>
                <th className={headerCls}>アクリルカバー有</th>
                <th className={headerCls}>下面開放形</th>
                <th className={headerCls}>ルーパー有</th>
              </tr>
            </thead>

            <tbody>
              {grouped.map((row, idx) => (
                <tr key={row.roomExamples} className="hover:bg-slate-50/60">
                  <td className={`${cellCls} text-center text-slate-400`}>
                    {idx + 1}
                  </td>
                  <td className={cellCls}>{row.roomExamples}</td>
                  <td className={`${cellCls} text-right`}>
                    {row.illuminanceLux}
                  </td>
                  {COL_DEFS.map((col) => (
                    <td key={col.key} className={`${cellCls} text-right`}>
                      {row.powers[col.key] != null
                        ? row.powers[col.key]!.toFixed(1)
                        : "-"}
                    </td>
                  ))}
                  <td className={cellCls} />
                </tr>
              ))}

              {grouped.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-4 text-center text-xs text-slate-400"
                  >
                    基準データがありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* User custom rows */}
      {rows.length > 0 && (
        <div className="border-t border-slate-200">
          <div className="px-5 py-2.5 bg-slate-50/60 border-b border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700">
              ユーザー入力行
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              セルを直接編集できます。電力密度と室面積から顕熱が自動計算されます。
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className={headerCls}>No.</th>
                  <th className={headerCls}>ID</th>
                  <th className={headerCls}>室ID</th>
                  <th className={headerCls}>照度 [lx]</th>
                  <th className={headerCls}>電力密度 [W/m&sup2;]</th>
                  <th className={headerCls}>顕熱 [W]</th>
                  <th className={headerCls}>潜熱 [W]</th>
                  <th className={headerCls} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className={`${cellCls} text-center text-slate-400`}>
                      {idx + 1}
                    </td>
                    <td className={cellCls}>{row.id}</td>
                    <td className={cellCls}>
                      <select
                        value={row.room_id}
                        onChange={(e) =>
                          handleUserRowChange(idx, "room_id", e.target.value)
                        }
                        className="w-full bg-transparent text-xs focus:outline-none"
                      >
                        <option value="">--</option>
                        {project.rooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.id}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={cellCls}>
                      <input
                        type="number"
                        value={row.illuminance_lux ?? ""}
                        onChange={(e) =>
                          handleUserRowChange(
                            idx,
                            "illuminance_lux",
                            e.target.value
                          )
                        }
                        className="w-20 bg-transparent text-xs text-right focus:outline-none"
                      />
                    </td>
                    <td className={cellCls}>
                      <input
                        type="number"
                        value={row.power_density_w_m2 ?? ""}
                        onChange={(e) =>
                          handleUserRowChange(
                            idx,
                            "power_density_w_m2",
                            e.target.value
                          )
                        }
                        className="w-20 bg-transparent text-xs text-right focus:outline-none"
                      />
                    </td>
                    <td className={`${cellCls} text-right`}>
                      {row.sensible_w > 0 ? row.sensible_w : ""}
                    </td>
                    <td className={cellCls}>
                      <input
                        type="number"
                        value={row.latent_w ?? ""}
                        onChange={(e) =>
                          handleUserRowChange(idx, "latent_w", e.target.value)
                        }
                        className="w-20 bg-transparent text-xs text-right focus:outline-none"
                      />
                    </td>
                    <td className={`${cellCls} text-center`}>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="text-slate-400 hover:text-red-500"
                        title="行を削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
