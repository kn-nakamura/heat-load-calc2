import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { GlassWater, Layers, Plus, Trash2 } from "lucide-react";
import GridEditor from "../GridEditor";
import type { Project, Construction, ConstructionLayer, Glass } from "../../types";
import api from "../../api/client";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  project: Project;
  onChange: (project: Project) => void;
}

/* ------------------------------------------------------------------ */
/*  Reference-data types (API responses)                               */
/* ------------------------------------------------------------------ */

interface GlassPropertyRecord {
  record_id: number;
  glass_code: string;
  glass_type: string;
  glass_description: string;
  frame_type: string;
  sc_no_blind: number;
  sc_light_blind: number;
  sc_medium_blind: number;
  u_value_glass_w_per_m2k: number;
  u_value_glass_blind_w_per_m2k: number;
}

interface MaterialRecord {
  material_no: number;
  category: string;
  material_name: string;
  thermal_conductivity_w_per_mk: number;
  volumetric_heat_capacity_kj_per_m3k: number;
  thermal_constant_gamma_a_m2k_per_w: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

type Tab = "glass" | "construction";

const BLIND_TYPE_OPTIONS = ["なし", "明色ブラインド", "中間色ブラインド"] as const;

const WALL_TYPE_OPTIONS = [
  { value: "exterior_wall", label: "外壁" },
  { value: "roof", label: "屋根" },
  { value: "floor", label: "床" },
  { value: "internal_wall", label: "内壁" },
  { value: "basement", label: "地下・地中" },
] as const;

/* ------------------------------------------------------------------ */
/*  Helper functions                                                   */
/* ------------------------------------------------------------------ */

/** Generate next auto-increment ID like GL-01, CN-02, etc. */
const getNextId = (items: { id: string }[], prefix: string): string => {
  const regex = new RegExp(`^${prefix}-(\\d+)$`);
  const maxNum = items.reduce((max, item) => {
    const match = item.id.match(regex);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  return `${prefix}-${String(maxNum + 1).padStart(2, "0")}`;
};

/** Pick SC value based on blind type. */
const computeSC = (rec: GlassPropertyRecord, blindType?: string): number => {
  switch (blindType) {
    case "明色ブラインド":
      return rec.sc_light_blind;
    case "中間色ブラインド":
      return rec.sc_medium_blind;
    default:
      return rec.sc_no_blind;
  }
};

/** Pick U-value based on blind type. */
const computeGlassU = (rec: GlassPropertyRecord, blindType?: string): number => {
  if (blindType === "明色ブラインド" || blindType === "中間色ブラインド") {
    return rec.u_value_glass_blind_w_per_m2k;
  }
  return rec.u_value_glass_w_per_m2k;
};

/** Recalculate total_resistance and u_value_w_m2k for a Construction. */
const recalcConstruction = (c: Construction): Construction => {
  if (c.u_value_override != null) {
    return { ...c, u_value_w_m2k: c.u_value_override };
  }
  const ao = c.ao_winter ?? c.ao_summer;
  const ai = c.ai;
  if (!ao || ao <= 0 || !ai || ai <= 0) {
    return { ...c, total_resistance: undefined, u_value_w_m2k: undefined };
  }
  const sumGamma = c.layers.reduce((s, l) => s + (l.thermal_resistance ?? 0), 0);
  const totalR = 1 / ao + sumGamma + 1 / ai;
  if (totalR <= 0) {
    return { ...c, total_resistance: undefined, u_value_w_m2k: undefined };
  }
  return { ...c, total_resistance: totalR, u_value_w_m2k: 1 / totalR };
};

/* ------------------------------------------------------------------ */
/*  Style helpers                                                      */
/* ------------------------------------------------------------------ */

const tabButtonStyles = (active: boolean) =>
  `inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
    active
      ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
  }`;

const subTabButtonStyles = (active: boolean) =>
  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
    active
      ? "bg-slate-900 text-white shadow-sm"
      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
  }`;

const inputCls =
  "w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500";

const readOnlyCellCls = "px-3 py-1.5 text-xs text-slate-600";

const numCellCls = "px-3 py-1.5 text-right text-xs font-mono text-slate-700";

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function GlassStructurePage({ project, onChange }: Props) {
  /* ---- local state ---- */
  const [activeTab, setActiveTab] = useState<Tab>("glass");
  const [activeWallType, setActiveWallType] = useState("exterior_wall");
  const [selectedConstructionId, setSelectedConstructionId] = useState<string | null>(null);
  const [selectedGlassIds, setSelectedGlassIds] = useState<Set<string>>(new Set());

  /* reference data from API */
  const [glassRecords, setGlassRecords] = useState<GlassPropertyRecord[]>([]);
  const [materialRecords, setMaterialRecords] = useState<MaterialRecord[]>([]);

  /* ---- fetch reference data on mount ---- */
  useEffect(() => {
    api
      .get("/reference/glass_properties")
      .then((res) => setGlassRecords(res.data.data.records))
      .catch(console.error);
    api
      .get("/reference/material_thermal_constants")
      .then((res) => setMaterialRecords(res.data.data.records))
      .catch(console.error);
  }, []);

  /* ================================================================ */
  /*  Glass tab helpers                                                */
  /* ================================================================ */

  /** Unique glass_description values for dropdown. */
  const glassDescriptionOptions = useMemo(() => {
    const seen = new Set<string>();
    const result: GlassPropertyRecord[] = [];
    for (const r of glassRecords) {
      if (!seen.has(r.glass_description)) {
        seen.add(r.glass_description);
        result.push(r);
      }
    }
    return result;
  }, [glassRecords]);

  /* -- mutators -- */

  const replaceGlasses = useCallback(
    (glasses: Glass[]) => onChange({ ...project, glasses }),
    [project, onChange],
  );

  const updateGlass = useCallback(
    (id: string, patch: Partial<Glass>) => {
      replaceGlasses(project.glasses.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    },
    [project.glasses, replaceGlasses],
  );

  const handleAddGlass = useCallback(() => {
    const newGlass: Glass = {
      id: getNextId(project.glasses, "GL"),
      blind_type: "なし",
    };
    replaceGlasses([...project.glasses, newGlass]);
  }, [project.glasses, replaceGlasses]);

  const handleDeleteSelectedGlasses = useCallback(() => {
    if (selectedGlassIds.size === 0) return;
    replaceGlasses(project.glasses.filter((g) => !selectedGlassIds.has(g.id)));
    setSelectedGlassIds(new Set());
  }, [project.glasses, replaceGlasses, selectedGlassIds]);

  /** When user picks a glass_description from the dropdown. */
  const handleGlassDescriptionChange = useCallback(
    (id: string, description: string) => {
      const rec = glassRecords.find((r) => r.glass_description === description);
      const glass = project.glasses.find((g) => g.id === id);
      const blindType = glass?.blind_type ?? "なし";
      if (rec) {
        updateGlass(id, {
          glass_description: description,
          glass_code: rec.glass_code,
          glass_type: rec.glass_type,
          sc: computeSC(rec, blindType),
          u_value_w_m2k: computeGlassU(rec, blindType),
        });
      } else {
        updateGlass(id, { glass_description: description || undefined });
      }
    },
    [project.glasses, glassRecords, updateGlass],
  );

  /** When user finishes typing a glass_code (on blur), look up record. */
  const handleGlassCodeBlur = useCallback(
    (id: string, code: string) => {
      const rec = glassRecords.find((r) => r.glass_code === code);
      const glass = project.glasses.find((g) => g.id === id);
      const blindType = glass?.blind_type ?? "なし";
      if (rec) {
        updateGlass(id, {
          glass_code: code,
          glass_description: rec.glass_description,
          glass_type: rec.glass_type,
          sc: computeSC(rec, blindType),
          u_value_w_m2k: computeGlassU(rec, blindType),
        });
      }
    },
    [project.glasses, glassRecords, updateGlass],
  );

  /** When blind_type changes, recalculate SC and K. */
  const handleBlindTypeChange = useCallback(
    (id: string, blindType: string) => {
      const glass = project.glasses.find((g) => g.id === id);
      if (!glass) return;
      const rec = glassRecords.find((r) => r.glass_code === glass.glass_code);
      if (rec) {
        updateGlass(id, {
          blind_type: blindType,
          sc: computeSC(rec, blindType),
          u_value_w_m2k: computeGlassU(rec, blindType),
        });
      } else {
        updateGlass(id, { blind_type: blindType });
      }
    },
    [project.glasses, glassRecords, updateGlass],
  );

  /* -- selection -- */

  const toggleGlassSelection = useCallback((id: string) => {
    setSelectedGlassIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllGlassSelection = useCallback(() => {
    setSelectedGlassIds((prev) =>
      prev.size === project.glasses.length
        ? new Set()
        : new Set(project.glasses.map((g) => g.id)),
    );
  }, [project.glasses]);

  /* ================================================================ */
  /*  Construction tab helpers                                         */
  /* ================================================================ */

  const filteredConstructions = useMemo(
    () => project.constructions.filter((c) => c.wall_type === activeWallType),
    [project.constructions, activeWallType],
  );

  const selectedConstruction = useMemo(
    () => project.constructions.find((c) => c.id === selectedConstructionId) ?? null,
    [project.constructions, selectedConstructionId],
  );

  const wallTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const opt of WALL_TYPE_OPTIONS) {
      counts[opt.value] = project.constructions.filter((c) => c.wall_type === opt.value).length;
    }
    return counts;
  }, [project.constructions]);

  /* -- construction list columns (for GridEditor) -- */

  const constructionListColumns = useMemo<ColDef<Construction>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 100, editable: false },
      { field: "name", headerName: "名称", minWidth: 160 },
    ],
    [],
  );

  /** Replace constructions for the active wall_type with the rows coming from the GridEditor. */
  const handleConstructionListChange = useCallback(
    (newFilteredRows: Construction[]) => {
      const others = project.constructions.filter((c) => c.wall_type !== activeWallType);
      const tagged = newFilteredRows.map((c) => ({ ...c, wall_type: activeWallType }));
      onChange({ ...project, constructions: [...others, ...tagged] });
    },
    [project, onChange, activeWallType],
  );

  const createEmptyConstruction = useCallback(
    (): Construction => ({
      id: getNextId(project.constructions, "CN"),
      name: "",
      wall_type: activeWallType,
      layers: [],
      ao_summer: 23,
      ao_winter: 23,
      ai: 9,
    }),
    [project.constructions, activeWallType],
  );

  /** Patch a single construction by id, then auto-recalculate K. */
  const patchConstruction = useCallback(
    (id: string, patch: Partial<Construction>) => {
      const constructions = project.constructions.map((c) => {
        if (c.id !== id) return c;
        return recalcConstruction({ ...c, ...patch });
      });
      onChange({ ...project, constructions });
    },
    [project, onChange],
  );

  /* -- layer operations -- */

  const handleAddLayer = useCallback(() => {
    if (!selectedConstruction) return;
    const newLayer: ConstructionLayer = {
      layer_no: selectedConstruction.layers.length + 1,
      material_name: "",
    };
    patchConstruction(selectedConstruction.id, {
      layers: [...selectedConstruction.layers, newLayer],
    });
  }, [selectedConstruction, patchConstruction]);

  const handleDeleteLayer = useCallback(
    (layerNo: number) => {
      if (!selectedConstruction) return;
      const newLayers = selectedConstruction.layers
        .filter((l) => l.layer_no !== layerNo)
        .map((l, i) => ({ ...l, layer_no: i + 1 }));
      patchConstruction(selectedConstruction.id, { layers: newLayers });
    },
    [selectedConstruction, patchConstruction],
  );

  const handleLayerChange = useCallback(
    (layerNo: number, field: keyof ConstructionLayer, value: unknown) => {
      if (!selectedConstruction) return;
      const newLayers = selectedConstruction.layers.map((l) => {
        if (l.layer_no !== layerNo) return l;
        const updated = { ...l, [field]: value };

        // When material changes, auto-fill conductivity & resistance
        if (field === "material_name") {
          const mat = materialRecords.find((m) => m.material_name === value);
          if (mat) {
            updated.thermal_conductivity = mat.thermal_conductivity_w_per_mk;
            if (mat.thermal_constant_gamma_a_m2k_per_w > 0) {
              updated.thermal_resistance = mat.thermal_constant_gamma_a_m2k_per_w;
            } else if (updated.thickness_mm && mat.thermal_conductivity_w_per_mk > 0) {
              updated.thermal_resistance =
                updated.thickness_mm / 1000 / mat.thermal_conductivity_w_per_mk;
            } else {
              updated.thermal_resistance = undefined;
            }
          } else {
            updated.thermal_conductivity = undefined;
            updated.thermal_resistance = undefined;
          }
        }

        // When thickness changes, recalculate resistance
        if (field === "thickness_mm") {
          const mat = materialRecords.find((m) => m.material_name === updated.material_name);
          if (mat) {
            if (mat.thermal_constant_gamma_a_m2k_per_w > 0) {
              updated.thermal_resistance = mat.thermal_constant_gamma_a_m2k_per_w;
            } else if (updated.thickness_mm && mat.thermal_conductivity_w_per_mk > 0) {
              updated.thermal_resistance =
                updated.thickness_mm / 1000 / mat.thermal_conductivity_w_per_mk;
            } else {
              updated.thermal_resistance = undefined;
            }
          }
        }

        return updated;
      });
      patchConstruction(selectedConstruction.id, { layers: newLayers });
    },
    [selectedConstruction, materialRecords, patchConstruction],
  );

  const handleConstructionFieldChange = useCallback(
    (field: keyof Construction, value: unknown) => {
      if (!selectedConstruction) return;
      patchConstruction(selectedConstruction.id, { [field]: value } as Partial<Construction>);
    },
    [selectedConstruction, patchConstruction],
  );

  const handleOverrideToggle = useCallback(() => {
    if (!selectedConstruction) return;
    if (selectedConstruction.u_value_override != null) {
      patchConstruction(selectedConstruction.id, { u_value_override: undefined });
    } else {
      patchConstruction(selectedConstruction.id, {
        u_value_override: selectedConstruction.u_value_w_m2k ?? 0,
      });
    }
  }, [selectedConstruction, patchConstruction]);

  /* ================================================================ */
  /*  Tab metadata                                                     */
  /* ================================================================ */

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    {
      key: "glass",
      label: "窓ガラス",
      icon: <GlassWater size={15} />,
      count: project.glasses.length,
    },
    {
      key: "construction",
      label: "構造体",
      icon: <Layers size={15} />,
      count: project.constructions.length,
    },
  ];

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* ---- main tab bar ---- */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={tabButtonStyles(activeTab === tab.key)}
          >
            {tab.icon}
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  GLASS TAB                                                    */}
      {/* ============================================================ */}
      {activeTab === "glass" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                窓ガラス仕様 (Glass Specifications)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                種別またはガラス記号を指定すると遮蔽係数・熱通過率が自動設定されます
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddGlass}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
              >
                <Plus size={14} /> 行追加
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedGlasses}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
              >
                <Trash2 size={14} /> 選択削除
              </button>
            </div>
          </div>

          {/* table */}
          <div className="overflow-auto" style={{ maxHeight: "520px" }}>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-center w-10">
                    <input
                      type="checkbox"
                      checked={
                        project.glasses.length > 0 &&
                        selectedGlassIds.size === project.glasses.length
                      }
                      onChange={toggleAllGlassSelection}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-20">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 min-w-[260px]">
                    種別
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-28">
                    記号
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-32">
                    ガラス種類
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 min-w-[150px]">
                    ブラインド種別
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 w-24">
                    遮蔽係数 SC
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 w-36">
                    熱通過率 K [W/(m²·K)]
                  </th>
                </tr>
              </thead>

              <tbody>
                {project.glasses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-10 text-center text-xs text-slate-400"
                    >
                      データがありません。「行追加」ボタンでガラスを追加してください。
                    </td>
                  </tr>
                ) : (
                  project.glasses.map((glass) => (
                    <tr
                      key={glass.id}
                      className="border-t border-slate-100 hover:bg-slate-50/50"
                    >
                      {/* checkbox */}
                      <td className="px-3 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedGlassIds.has(glass.id)}
                          onChange={() => toggleGlassSelection(glass.id)}
                          className="rounded border-slate-300"
                        />
                      </td>

                      {/* ID (read-only) */}
                      <td className="px-3 py-1.5 text-xs text-slate-500 font-mono">
                        {glass.id}
                      </td>

                      {/* 種別 (glass_description dropdown) */}
                      <td className="px-3 py-1.5">
                        <select
                          value={glass.glass_description ?? ""}
                          onChange={(e) =>
                            handleGlassDescriptionChange(glass.id, e.target.value)
                          }
                          className={inputCls}
                        >
                          <option value="">-- 選択 --</option>
                          {glassDescriptionOptions.map((rec) => (
                            <option key={rec.record_id} value={rec.glass_description}>
                              {rec.glass_description}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 記号 (glass_code, editable text) */}
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={glass.glass_code ?? ""}
                          onChange={(e) =>
                            updateGlass(glass.id, { glass_code: e.target.value })
                          }
                          onBlur={(e) =>
                            handleGlassCodeBlur(glass.id, e.target.value)
                          }
                          className={inputCls}
                          placeholder="例: 2FA06"
                        />
                      </td>

                      {/* ガラス種類 (read-only) */}
                      <td className={readOnlyCellCls}>{glass.glass_type ?? "-"}</td>

                      {/* ブラインド種別 dropdown */}
                      <td className="px-3 py-1.5">
                        <select
                          value={glass.blind_type ?? "なし"}
                          onChange={(e) =>
                            handleBlindTypeChange(glass.id, e.target.value)
                          }
                          className={inputCls}
                        >
                          {BLIND_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 遮蔽係数 SC (read-only) */}
                      <td className={numCellCls}>
                        {glass.sc != null ? glass.sc.toFixed(2) : "-"}
                      </td>

                      {/* 熱通過率 K (read-only) */}
                      <td className={numCellCls}>
                        {glass.u_value_w_m2k != null
                          ? glass.u_value_w_m2k.toFixed(2)
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  CONSTRUCTION TAB                                             */}
      {/* ============================================================ */}
      {activeTab === "construction" && (
        <div className="space-y-3">
          {/* wall-type sub-tabs */}
          <div className="flex flex-wrap gap-2">
            {WALL_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setActiveWallType(opt.value);
                  setSelectedConstructionId(null);
                }}
                className={subTabButtonStyles(activeWallType === opt.value)}
              >
                {opt.label}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeWallType === opt.value
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {wallTypeCounts[opt.value] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* split layout: list | detail */}
          <div className="flex gap-4">
            {/* ---- left: construction list (GridEditor) ---- */}
            <div className="w-2/5">
              <GridEditor
                title={`構造体一覧 (${WALL_TYPE_OPTIONS.find((o) => o.value === activeWallType)?.label ?? ""})`}
                hint="構造体を選択して右パネルで層構成を編集"
                rows={filteredConstructions}
                columns={constructionListColumns}
                createEmptyRow={createEmptyConstruction}
                onChange={handleConstructionListChange}
                height="560px"
                rowSelection="single"
                onSelectionChange={(rows) =>
                  setSelectedConstructionId(rows.length > 0 ? rows[0].id : null)
                }
              />
            </div>

            {/* ---- right: layer editor ---- */}
            <div className="w-3/5">
              {selectedConstruction ? (
                <ConstructionDetail
                  construction={selectedConstruction}
                  materialRecords={materialRecords}
                  onAddLayer={handleAddLayer}
                  onDeleteLayer={handleDeleteLayer}
                  onLayerChange={handleLayerChange}
                  onFieldChange={handleConstructionFieldChange}
                  onOverrideToggle={handleOverrideToggle}
                />
              ) : (
                <div
                  className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center"
                  style={{ height: "560px" }}
                >
                  <p className="text-sm text-slate-400">
                    左の一覧から構造体を選択してください
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  ConstructionDetail (right-panel sub-component)                     */
/* ================================================================== */

interface ConstructionDetailProps {
  construction: Construction;
  materialRecords: MaterialRecord[];
  onAddLayer: () => void;
  onDeleteLayer: (layerNo: number) => void;
  onLayerChange: (layerNo: number, field: keyof ConstructionLayer, value: unknown) => void;
  onFieldChange: (field: keyof Construction, value: unknown) => void;
  onOverrideToggle: () => void;
}

function ConstructionDetail({
  construction,
  materialRecords,
  onAddLayer,
  onDeleteLayer,
  onLayerChange,
  onFieldChange,
  onOverrideToggle,
}: ConstructionDetailProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* header */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-sm font-semibold text-slate-800">
          層構成: {construction.name || construction.id}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          材料と厚さを入力してください。熱抵抗・熱通過率は自動計算されます。
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* ---- layer table ---- */}
        <div className="overflow-auto" style={{ maxHeight: "300px" }}>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-1.5 text-center text-xs font-semibold text-slate-600 w-10">
                  #
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-semibold text-slate-600 min-w-[200px]">
                  材料名
                </th>
                <th className="px-2 py-1.5 text-right text-xs font-semibold text-slate-600 w-24">
                  厚さ [mm]
                </th>
                <th className="px-2 py-1.5 text-right text-xs font-semibold text-slate-600 w-28">
                  熱伝導率 λ [W/(m·K)]
                </th>
                <th className="px-2 py-1.5 text-right text-xs font-semibold text-slate-600 w-28">
                  熱抵抗 γ [m²·K/W]
                </th>
                <th className="px-2 py-1.5 text-center text-xs font-semibold text-slate-600 w-10" />
              </tr>
            </thead>
            <tbody>
              {construction.layers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-2 py-6 text-center text-xs text-slate-400"
                  >
                    層がありません。「層追加」ボタンで追加してください。
                  </td>
                </tr>
              ) : (
                construction.layers.map((layer) => (
                  <tr key={layer.layer_no} className="border-t border-slate-100">
                    <td className="px-2 py-1 text-center text-xs text-slate-400">
                      {layer.layer_no}
                    </td>

                    {/* material dropdown */}
                    <td className="px-2 py-1">
                      <select
                        value={layer.material_name}
                        onChange={(e) =>
                          onLayerChange(layer.layer_no, "material_name", e.target.value)
                        }
                        className={inputCls}
                      >
                        <option value="">-- 選択 --</option>
                        {materialRecords.map((m) => (
                          <option key={m.material_no} value={m.material_name}>
                            {m.material_name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* thickness */}
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={layer.thickness_mm ?? ""}
                        onChange={(e) =>
                          onLayerChange(
                            layer.layer_no,
                            "thickness_mm",
                            e.target.value === "" ? undefined : Number(e.target.value),
                          )
                        }
                        className={`${inputCls} text-right`}
                        placeholder="0"
                        min={0}
                      />
                    </td>

                    {/* conductivity (read-only) */}
                    <td className="px-2 py-1 text-right text-xs font-mono text-slate-600">
                      {layer.thermal_conductivity != null
                        ? layer.thermal_conductivity.toFixed(3)
                        : "-"}
                    </td>

                    {/* resistance (read-only) */}
                    <td className="px-2 py-1 text-right text-xs font-mono text-slate-600">
                      {layer.thermal_resistance != null
                        ? layer.thermal_resistance.toFixed(4)
                        : "-"}
                    </td>

                    {/* delete button */}
                    <td className="px-2 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteLayer(layer.layer_no)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="層を削除"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* add-layer button */}
        <div>
          <button
            type="button"
            onClick={onAddLayer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
          >
            <Plus size={14} /> 層追加
          </button>
        </div>

        {/* ---- surface heat transfer coefficients ---- */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">
            表面熱伝達率
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">
                αo 夏 [W/(m²·K)]
              </label>
              <input
                type="number"
                value={construction.ao_summer ?? ""}
                onChange={(e) =>
                  onFieldChange(
                    "ao_summer",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
                className={inputCls}
                step="any"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">
                αo 冬 [W/(m²·K)]
              </label>
              <input
                type="number"
                value={construction.ao_winter ?? ""}
                onChange={(e) =>
                  onFieldChange(
                    "ao_winter",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
                className={inputCls}
                step="any"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">
                αi [W/(m²·K)]
              </label>
              <input
                type="number"
                value={construction.ai ?? ""}
                onChange={(e) =>
                  onFieldChange(
                    "ai",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
                className={inputCls}
                step="any"
              />
            </div>
          </div>
        </div>

        {/* ---- U-value display & override ---- */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-700">熱通過率 K</h4>
              <p className="text-lg font-bold text-primary-700 mt-1">
                {construction.u_value_w_m2k != null
                  ? `${construction.u_value_w_m2k.toFixed(3)} W/(m²·K)`
                  : "- W/(m²·K)"}
              </p>
              {construction.total_resistance != null &&
                construction.u_value_override == null && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    総熱抵抗 R = {construction.total_resistance.toFixed(4)} m²·K/W
                  </p>
                )}
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={construction.u_value_override != null}
                onChange={onOverrideToggle}
                className="rounded border-slate-300"
              />
              熱通過率Kを直接入力
            </label>
          </div>

          {construction.u_value_override != null && (
            <div className="mt-2">
              <input
                type="number"
                step="0.001"
                value={construction.u_value_override ?? ""}
                onChange={(e) =>
                  onFieldChange(
                    "u_value_override",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
                className={`${inputCls} w-48 text-sm`}
                placeholder="K値を直接入力 [W/(m²·K)]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
