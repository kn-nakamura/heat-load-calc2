import { useEffect, useRef, useState } from "react";
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

const SOLAR_REGION_OPTIONS = ["札幌", "仙台", "東京", "大阪", "福岡", "那覇"];

const SOLAR_REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  札幌: { lat: 43.0618, lon: 141.3545 },
  仙台: { lat: 38.2682, lon: 140.8694 },
  東京: { lat: 35.6895, lon: 139.6917 },
  大阪: { lat: 34.6937, lon: 135.5023 },
  福岡: { lat: 33.5902, lon: 130.4017 },
  那覇: { lat: 26.2124, lon: 127.6792 },
};

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_RATE_LIMIT_MS = 1100;

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

const normalizeText = (value: string) => value.replace(/\s+/g, "").toLowerCase();

const extractAddressCandidates = (result: NominatimResult) => {
  const address = result.address ?? {};
  return [
    result.display_name,
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.county,
    address.state,
    address.region,
    address.prefecture,
  ].filter((item): item is string => Boolean(item));
};

const findRegionMatch = (candidates: string[], options: string[]) => {
  const normalizedCandidates = candidates.map(normalizeText);
  return options.find((option) =>
    normalizedCandidates.some((candidate) => candidate.includes(normalizeText(option))),
  );
};

const toRadians = (deg: number) => (deg * Math.PI) / 180;

const haversineDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const r = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
};

const pickNearestSolarRegion = (lat: number, lon: number) => {
  let nearest = SOLAR_REGION_OPTIONS[0];
  let nearestDistance = Number.POSITIVE_INFINITY;
  SOLAR_REGION_OPTIONS.forEach((region) => {
    const coords = SOLAR_REGION_COORDS[region];
    const distance = haversineDistanceKm(lat, lon, coords.lat, coords.lon);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = region;
    }
  });
  return nearest;
};

export default function DesignConditionsPage({ project, onChange }: Props) {
  const [locationQuery, setLocationQuery] = useState(project.location_label);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const lastRequestRef = useRef(0);

  const updateField = (field: keyof Project, value: string) => {
    onChange({ ...project, [field]: value });
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

  useEffect(() => {
    setLocationQuery(project.location_label);
  }, [project.location_label]);

  useEffect(() => {
    const trimmed = locationQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      const run = async () => {
        const wait = Math.max(0, NOMINATIM_RATE_LIMIT_MS - (Date.now() - lastRequestRef.current));
        if (wait > 0) {
          await new Promise((resolve) => setTimeout(resolve, wait));
        }
        if (controller.signal.aborted) {
          return;
        }
        setIsSearching(true);
        setSearchError(null);
        try {
          const params = new URLSearchParams({
            format: "jsonv2",
            q: trimmed,
            addressdetails: "1",
            limit: "6",
            countrycodes: "jp",
          });
          const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
            signal: controller.signal,
            headers: {
              "Accept-Language": "ja,en",
            },
          });
          if (!response.ok) {
            throw new Error(`Nominatim request failed: ${response.status}`);
          }
          const data = (await response.json()) as NominatimResult[];
          setSuggestions(data);
          if (data.length === 0) {
            setSearchError("該当候補が見つかりませんでした。");
          }
        } catch (error) {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setSearchError("検索に失敗しました。手動で地域を選択してください。");
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsSearching(false);
            lastRequestRef.current = Date.now();
          }
        }
      };
      void run();
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [locationQuery]);

  const handleLocationSelect = (result: NominatimResult) => {
    const lat = Number(result.lat);
    const lon = Number(result.lon);
    const candidates = extractAddressCandidates(result);
    const matchedRegion = findRegionMatch(candidates, REGION_OPTIONS);
    const selectedSolarRegion = Number.isFinite(lat) && Number.isFinite(lon)
      ? pickNearestSolarRegion(lat, lon)
      : project.solar_region;

    onChange({
      ...project,
      location_lat: Number.isFinite(lat) ? lat : project.location_lat,
      location_lon: Number.isFinite(lon) ? lon : project.location_lon,
      location_label: result.display_name,
      region: matchedRegion ?? project.region,
      solar_region: selectedSolarRegion ?? project.solar_region,
    });
    setLocationQuery(result.display_name);
    setSuggestions([]);
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
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-medium text-slate-600">
                所在地検索 / Location Search (Nominatim)
              </label>
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="例: 東京都千代田区 / 札幌駅"
                className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400"
              />
              <div className="flex flex-col gap-1 text-xs text-slate-500">
                <span>リクエスト先: {NOMINATIM_ENDPOINT}</span>
                <span>レート制限目安: 1秒に1回程度。失敗時は下の地区選択で手動指定してください。</span>
              </div>
              {project.location_lat !== null && project.location_lon !== null && (
                <div className="text-xs text-slate-600">
                  選択座標: {project.location_lat.toFixed(5)}, {project.location_lon.toFixed(5)}
                </div>
              )}
              {isSearching && <div className="text-xs text-slate-400">検索中...</div>}
              {searchError && <div className="text-xs text-rose-500">{searchError}</div>}
              {suggestions.length > 0 && (
                <ul className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-sm">
                  {suggestions.map((item) => (
                    <li key={`${item.display_name}-${item.lat}-${item.lon}`}>
                      <button
                        type="button"
                        onClick={() => handleLocationSelect(item)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50"
                      >
                        {item.display_name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
              label="日射地区 / Solar Region"
              value={project.solar_region}
              onChange={(v) => updateField("solar_region", v)}
              options={SOLAR_REGION_OPTIONS.map((r) => ({ value: r, label: r }))}
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
    </div>
  );
}
