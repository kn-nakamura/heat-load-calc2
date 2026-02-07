import { useMemo, useState } from "react";
import type { ColDef, ValueParserParams } from "ag-grid-community";
import { GlassWater, Layers } from "lucide-react";
import GridEditor from "../GridEditor";
import type { Project, Construction, Glass } from "../../types";

interface Props {
  project: Project;
  onChange: (project: Project) => void;
}

const numberParser = (params: ValueParserParams): number | undefined => {
  const raw = params.newValue;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : undefined;
  const value = String(raw).trim();
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const createEmptyGlass = (glassType = "") =>
  ({
    id: "",
    name: "",
    solar_gain_key: "",
    glass_type: glassType,
    u_value_w_m2k: "",
  } as unknown as Glass);

const createEmptyConstruction = (wallType = "") =>
  ({
    id: "",
    name: "",
    u_value_w_m2k: "",
    wall_type: wallType,
  } as unknown as Construction);

type Tab = "glass" | "construction";

const glassTypeOptions = [
  { value: "window", label: "窓ガラス" },
  { value: "awning", label: "ひさし" },
];

const wallTypeOptions = [
  { value: "exterior_wall", label: "外壁" },
  { value: "roof", label: "屋根" },
  { value: "floor", label: "床" },
  { value: "internal_wall", label: "内壁" },
  { value: "basement", label: "地下・地中" },
];

const glassTypeLabels = new Map(glassTypeOptions.map((option) => [option.value, option.label]));
const wallTypeLabels = new Map(wallTypeOptions.map((option) => [option.value, option.label]));

const tabButtonStyles = (isActive: boolean) =>
  `
    inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
    ${isActive
      ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
    }
  `;

const subTabButtonStyles = (isActive: boolean) =>
  `
    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
    ${isActive
      ? "bg-slate-900 text-white shadow-sm"
      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
    }
  `;

export default function GlassStructurePage({ project, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("glass");
  const [activeGlassType, setActiveGlassType] = useState<string>("all");
  const [activeWallType, setActiveWallType] = useState<string>("all");

  const glassColumns = useMemo<ColDef<Glass>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 110 },
      { field: "name", headerName: "名称", minWidth: 160 },
      {
        field: "glass_type",
        headerName: "種別",
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["", ...glassTypeOptions.map((option) => option.value)] },
        valueFormatter: (params) => {
          const value = String(params.value ?? "");
          return glassTypeLabels.get(value) ?? value;
        },
        minWidth: 130,
      },
      { field: "solar_gain_key", headerName: "日射取得キー", minWidth: 140 },
      {
        field: "u_value_w_m2k",
        headerName: "U値 [W/m²K]",
        valueParser: numberParser,
        minWidth: 130,
      },
    ],
    []
  );

  const constructionColumns = useMemo<ColDef<Construction>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 110 },
      { field: "name", headerName: "名称", minWidth: 200 },
      {
        field: "u_value_w_m2k",
        headerName: "U値 [W/m²K]",
        valueParser: numberParser,
        minWidth: 130,
      },
      {
        field: "wall_type",
        headerName: "壁種別",
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["", ...wallTypeOptions.map((option) => option.value)] },
        valueFormatter: (params) => {
          const value = String(params.value ?? "");
          return wallTypeLabels.get(value) ?? value;
        },
        minWidth: 140,
      },
    ],
    []
  );

  const tabs: { key: Tab; label: string; sublabel: string; icon: React.ReactNode; count: number }[] = [
    {
      key: "glass",
      label: "窓ガラス",
      sublabel: "Glass",
      icon: <GlassWater size={15} />,
      count: project.glasses.length,
    },
    {
      key: "construction",
      label: "構造体",
      sublabel: "Construction",
      icon: <Layers size={15} />,
      count: project.constructions.length,
    },
  ];

  const glassTypeTabs = useMemo(
    () => [
      { key: "all", label: "全て", count: project.glasses.length },
      ...glassTypeOptions.map((option) => ({
        key: option.value,
        label: option.label,
        count: project.glasses.filter((row) => row.glass_type === option.value).length,
      })),
    ],
    [project.glasses]
  );

  const wallTypeTabs = useMemo(
    () => [
      { key: "all", label: "全て", count: project.constructions.length },
      ...wallTypeOptions.map((option) => ({
        key: option.value,
        label: option.label,
        count: project.constructions.filter((row) => row.wall_type === option.value).length,
      })),
    ],
    [project.constructions]
  );

  const filteredGlasses = useMemo(
    () => (activeGlassType === "all" ? project.glasses : project.glasses.filter((row) => row.glass_type === activeGlassType)),
    [activeGlassType, project.glasses]
  );

  const filteredConstructions = useMemo(
    () => (activeWallType === "all" ? project.constructions : project.constructions.filter((row) => row.wall_type === activeWallType)),
    [activeWallType, project.constructions]
  );

  const updateRowsForType = <T extends Record<string, unknown>>(
    rows: T[],
    updatedRows: T[],
    typeKey: string,
    activeType: string
  ) => {
    if (activeType === "all") return updatedRows;
    const preserved = rows.filter((row) => row[typeKey] !== activeType);
    const withType = updatedRows.map((row) => ({ ...row, [typeKey]: activeType }));
    return [...preserved, ...withType];
  };

  return (
    <div className="space-y-6">
      {/* Tab bar */}
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
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Glass tab */}
      {activeTab === "glass" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {glassTypeTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveGlassType(tab.key)}
                className={subTabButtonStyles(activeGlassType === tab.key)}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeGlassType === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <GridEditor
            title="窓ガラス仕様 (Glass Specifications)"
            hint="ガラスのID、名称、種別、日射取得キー、U値を入力してください"
            rows={filteredGlasses}
            columns={glassColumns}
            createEmptyRow={() => createEmptyGlass(activeGlassType === "all" ? "" : activeGlassType)}
            onChange={(rows) =>
              onChange({
                ...project,
                glasses: updateRowsForType(project.glasses, rows, "glass_type", activeGlassType) as Glass[],
              })
            }
          />
        </div>
      )}

      {/* Construction tab */}
      {activeTab === "construction" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {wallTypeTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveWallType(tab.key)}
                className={subTabButtonStyles(activeWallType === tab.key)}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeWallType === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <GridEditor
            title="構造体仕様 (Construction Assemblies)"
            hint="構造体のID、名称、U値、壁種別を入力してください"
            rows={filteredConstructions}
            columns={constructionColumns}
            createEmptyRow={() => createEmptyConstruction(activeWallType === "all" ? "" : activeWallType)}
            onChange={(rows) =>
              onChange({
                ...project,
                constructions: updateRowsForType(project.constructions, rows, "wall_type", activeWallType) as Construction[],
              })
            }
          />
        </div>
      )}
    </div>
  );
}
