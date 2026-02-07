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

const createEmptyGlass = () =>
  ({
    id: "",
    name: "",
    solar_gain_key: "",
    u_value_w_m2k: "",
  } as unknown as Glass);

const createEmptyConstruction = () =>
  ({
    id: "",
    name: "",
    u_value_w_m2k: "",
    wall_type: "",
  } as unknown as Construction);

type Tab = "glass" | "construction";

export default function GlassStructurePage({ project, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("glass");

  const glassColumns = useMemo<ColDef<Glass>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 110 },
      { field: "name", headerName: "名称", minWidth: 160 },
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
        cellEditorParams: { values: ["exterior_wall", "roof", "floor", "internal_wall", "basement", ""] },
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

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`
              inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeTab === tab.key
                ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }
            `}
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
        <GridEditor
          title="窓ガラス仕様 (Glass Specifications)"
          hint="ガラスのID、名称、日射取得キー、U値を入力してください"
          rows={project.glasses}
          columns={glassColumns}
          createEmptyRow={createEmptyGlass}
          onChange={(rows) => onChange({ ...project, glasses: rows })}
        />
      )}

      {/* Construction tab */}
      {activeTab === "construction" && (
        <GridEditor
          title="構造体仕様 (Construction Assemblies)"
          hint="構造体のID、名称、U値、壁種別を入力してください"
          rows={project.constructions}
          columns={constructionColumns}
          createEmptyRow={createEmptyConstruction}
          onChange={(rows) => onChange({ ...project, constructions: rows })}
        />
      )}
    </div>
  );
}
