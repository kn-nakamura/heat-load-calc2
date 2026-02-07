import { Building2, Compass } from "lucide-react";
import type { Project, DesignCondition } from "../../types";

interface Props {
  project: Project;
  onChange: (project: Project) => void;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const REGION_OPTIONS = [
  "稚内", "旭川", "札幌", "室蘭", "青森", "盛岡", "仙台", "秋田",
  "山形", "福島", "水戸", "宇都宮", "前橋", "さいたま", "千葉", "東京",
  "横浜", "新潟", "富山", "金沢", "福井", "甲府", "長野", "岐阜",
  "静岡", "名古屋", "津", "大津", "京都", "大阪", "神戸", "奈良",
  "和歌山", "鳥取", "松江", "岡山", "広島", "山口", "徳島", "高松",
  "松山", "高知", "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎",
  "鹿児島", "那覇", "Tokyo",
];

const ORIENTATION_OPTIONS = [
  { value: "north", label: "北 (N)" },
  { value: "south", label: "南 (S)" },
  { value: "east", label: "東 (E)" },
  { value: "west", label: "西 (W)" },
];

const ROUNDING_MODE_OPTIONS = [
  { value: "ceil", label: "切り上げ" },
  { value: "round", label: "四捨五入" },
];

const OUTDOOR_AIR_STEP_OPTIONS = [
  { value: "10", label: "10" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

export default function DesignConditionsPage({ project, onChange }: Props) {
  const updateField = (field: keyof Project, value: string) => {
    onChange({ ...project, [field]: value });
  };

  const summerDc = project.design_conditions.find((d) => d.season === "summer");
  const winterDc = project.design_conditions.find((d) => d.season === "winter");
  const rounding = project.metadata.rounding ?? {
    occupancy: { mode: "round" },
    outdoor_air: { mode: "round", step: 10 },
  };

  const updateCondition = (season: "summer" | "winter", field: keyof DesignCondition, value: string) => {
    const updated = project.design_conditions.map((dc) => {
      if (dc.season === season) {
        if (field === "indoor_temp_c" || field === "indoor_rh_pct") {
          return { ...dc, [field]: value === "" ? "" : Number(value) };
        }
        return { ...dc, [field]: value };
      }
      return dc;
    });
    onChange({ ...project, design_conditions: updated });
  };

  const updateCorrectionFactor = (key: string, value: string) => {
    const num = value === "" ? 1.0 : Number(value);
    onChange({
      ...project,
      metadata: {
        ...project.metadata,
        correction_factors: {
          ...project.metadata.correction_factors,
          [key]: Number.isFinite(num) ? num : 1.0,
        },
      },
    });
  };

  const updateRounding = (section: "occupancy" | "outdoor_air", key: string, value: string) => {
    const next = {
      ...rounding,
      [section]: {
        ...rounding[section],
        [key]: key === "step" ? Number(value) : value,
      },
    };
    onChange({
      ...project,
      metadata: {
        ...project.metadata,
        rounding: next,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Building Overview */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Building2 size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-slate-800">建物概要</h3>
          <span className="text-xs text-slate-400">Building Overview</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="プロジェクト名 / Project Name"
              value={project.name}
              onChange={(v) => updateField("name", v)}
              placeholder="新規プロジェクト"
            />
            <SelectField
              label="地域 / Region"
              value={project.region}
              onChange={(v) => updateField("region", v)}
              options={REGION_OPTIONS.map((r) => ({ value: r, label: r }))}
            />
            <SelectField
              label="単位系 / Unit System"
              value={project.unit_system}
              onChange={(v) => updateField("unit_system", v)}
              options={[
                { value: "SI", label: "SI (国際単位系)" },
              ]}
            />
            <SelectField
              label="建物方位基準 / Orientation Basis"
              value={project.orientation_basis}
              onChange={(v) => updateField("orientation_basis", v)}
              options={ORIENTATION_OPTIONS}
            />
          </div>
        </div>
      </section>

      {/* Design Conditions */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Compass size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-slate-800">室内設計条件</h3>
          <span className="text-xs text-slate-400">Indoor Design Conditions</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summer */}
            <div className="p-4 bg-orange-50/50 border border-orange-200/50 rounded-xl">
              <h4 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                夏期 (Summer)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="室内温度 [°C]"
                  value={summerDc?.indoor_temp_c ?? ""}
                  onChange={(v) => updateCondition("summer", "indoor_temp_c", v)}
                  type="number"
                />
                <InputField
                  label="相対湿度 [%]"
                  value={summerDc?.indoor_rh_pct ?? ""}
                  onChange={(v) => updateCondition("summer", "indoor_rh_pct", v)}
                  type="number"
                />
              </div>
            </div>

            {/* Winter */}
            <div className="p-4 bg-blue-50/50 border border-blue-200/50 rounded-xl">
              <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                冬期 (Winter)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="室内温度 [°C]"
                  value={winterDc?.indoor_temp_c ?? ""}
                  onChange={(v) => updateCondition("winter", "indoor_temp_c", v)}
                  type="number"
                />
                <InputField
                  label="相対湿度 [%]"
                  value={winterDc?.indoor_rh_pct ?? ""}
                  onChange={(v) => updateCondition("winter", "indoor_rh_pct", v)}
                  type="number"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Correction Factors */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-800">補正係数</h3>
          <p className="text-xs text-slate-400 mt-0.5">Correction Factors (intermittent operation etc.)</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(project.metadata.correction_factors).map(([key, val]) => (
              <InputField
                key={key}
                label={key.replace(/_/g, " ")}
                value={val}
                onChange={(v) => updateCorrectionFactor(key, v)}
                type="number"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Rounding Settings */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-800">丸め設定</h3>
          <p className="text-xs text-slate-400 mt-0.5">Rounding rules for people and outdoor air.</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="人員の小数点以下丸め"
              value={rounding.occupancy.mode}
              onChange={(v) => updateRounding("occupancy", "mode", v)}
              options={ROUNDING_MODE_OPTIONS}
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="設計外気量まるめ"
                value={rounding.outdoor_air.mode}
                onChange={(v) => updateRounding("outdoor_air", "mode", v)}
                options={ROUNDING_MODE_OPTIONS}
              />
              <SelectField
                label="外気量丸め単位"
                value={String(rounding.outdoor_air.step)}
                onChange={(v) => updateRounding("outdoor_air", "step", v)}
                options={OUTDOOR_AIR_STEP_OPTIONS}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
