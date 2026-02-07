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
  value: string | number | null;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400"
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

export default function DesignConditionsPage({ project, onChange }: Props) {
  const updateField = (field: keyof Project, value: string) => {
    onChange({ ...project, [field]: value });
  };
  const updateNumberField = (
    field: "total_floor_area_m2" | "floors_above" | "floors_below",
    value: string,
  ) => {
    const num = value === "" ? null : Number(value);
    onChange({
      ...project,
      [field]: Number.isFinite(num) ? num : null,
    });
  };

  const summerDc = project.design_conditions.find((d) => d.season === "summer");
  const winterDc = project.design_conditions.find((d) => d.season === "winter");

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
            <InputField
              label="建物名称"
              value={project.building_name}
              onChange={(v) => updateField("building_name", v)}
              placeholder="例: ○○ビル"
            />
            <InputField
              label="所在地"
              value={project.building_location}
              onChange={(v) => updateField("building_location", v)}
              placeholder="例: 東京都千代田区"
            />
            <InputField
              label="建物用途"
              value={project.building_usage}
              onChange={(v) => updateField("building_usage", v)}
              placeholder="例: 事務所"
            />
            <InputField
              label="建物構造"
              value={project.building_structure}
              onChange={(v) => updateField("building_structure", v)}
              placeholder="例: 鉄筋コンクリート造"
            />
            <InputField
              label="延べ床面積 [m²]"
              value={project.total_floor_area_m2}
              onChange={(v) => updateNumberField("total_floor_area_m2", v)}
              type="number"
            />
            <InputField
              label="階数（地上）"
              value={project.floors_above}
              onChange={(v) => updateNumberField("floors_above", v)}
              type="number"
            />
            <InputField
              label="階数（地下）"
              value={project.floors_below}
              onChange={(v) => updateNumberField("floors_below", v)}
              type="number"
            />
            <InputField
              label="帳票作成者"
              value={project.report_author}
              onChange={(v) => updateField("report_author", v)}
              placeholder="例: 山田 太郎"
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
            <TextareaField
              label="備考"
              value={project.remarks}
              onChange={(v) => updateField("remarks", v)}
              placeholder="特記事項を入力"
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
    </div>
  );
}
