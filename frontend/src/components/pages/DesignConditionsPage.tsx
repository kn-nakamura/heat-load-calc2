import { useEffect, useRef, useState } from "react";
import { Building2 } from "lucide-react";
import type { Project } from "../../types";

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

const ROUNDING_MODE_OPTIONS = [
  { value: "ceil", label: "切り上げ" },
  { value: "round", label: "四捨五入" },
];

const OUTDOOR_AIR_STEP_OPTIONS = [
  { value: "10", label: "10" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
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

const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  稚内: { lat: 45.4156, lon: 141.6731 },
  旭川: { lat: 43.7706, lon: 142.3649 },
  札幌: { lat: 43.0618, lon: 141.3545 },
  室蘭: { lat: 42.3152, lon: 140.9738 },
  青森: { lat: 40.8246, lon: 140.74 },
  盛岡: { lat: 39.7036, lon: 141.1527 },
  仙台: { lat: 38.2682, lon: 140.8694 },
  秋田: { lat: 39.72, lon: 140.1026 },
  山形: { lat: 38.2554, lon: 140.3396 },
  福島: { lat: 37.7608, lon: 140.4747 },
  水戸: { lat: 36.3659, lon: 140.471 },
  宇都宮: { lat: 36.5551, lon: 139.8828 },
  前橋: { lat: 36.3895, lon: 139.0634 },
  さいたま: { lat: 35.8617, lon: 139.6455 },
  千葉: { lat: 35.6073, lon: 140.1063 },
  東京: { lat: 35.6895, lon: 139.6917 },
  横浜: { lat: 35.4437, lon: 139.638 },
  新潟: { lat: 37.9161, lon: 139.0364 },
  富山: { lat: 36.6953, lon: 137.2113 },
  金沢: { lat: 36.5613, lon: 136.6562 },
  福井: { lat: 36.0641, lon: 136.2195 },
  甲府: { lat: 35.662, lon: 138.5684 },
  長野: { lat: 36.6486, lon: 138.1948 },
  岐阜: { lat: 35.4233, lon: 136.7607 },
  静岡: { lat: 34.9756, lon: 138.3828 },
  名古屋: { lat: 35.1815, lon: 136.9066 },
  津: { lat: 34.7303, lon: 136.5086 },
  大津: { lat: 35.017, lon: 135.8548 },
  京都: { lat: 35.0116, lon: 135.7681 },
  大阪: { lat: 34.6937, lon: 135.5023 },
  神戸: { lat: 34.6901, lon: 135.1955 },
  奈良: { lat: 34.6851, lon: 135.8048 },
  和歌山: { lat: 34.2305, lon: 135.1708 },
  鳥取: { lat: 35.5011, lon: 134.2351 },
  松江: { lat: 35.4681, lon: 133.0484 },
  岡山: { lat: 34.6551, lon: 133.9195 },
  広島: { lat: 34.3853, lon: 132.4553 },
  山口: { lat: 34.1785, lon: 131.4737 },
  徳島: { lat: 34.0703, lon: 134.5548 },
  高松: { lat: 34.3428, lon: 134.0466 },
  松山: { lat: 33.8392, lon: 132.7657 },
  高知: { lat: 33.5597, lon: 133.5311 },
  福岡: { lat: 33.5902, lon: 130.4017 },
  佐賀: { lat: 33.2635, lon: 130.3009 },
  長崎: { lat: 32.7503, lon: 129.8777 },
  熊本: { lat: 32.8031, lon: 130.7079 },
  大分: { lat: 33.2396, lon: 131.6093 },
  宮崎: { lat: 31.9077, lon: 131.4202 },
  鹿児島: { lat: 31.5966, lon: 130.5571 },
  那覇: { lat: 26.2124, lon: 127.6809 },
  Tokyo: { lat: 35.6895, lon: 139.6917 },
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

const pickNearestRegion = (lat: number, lon: number) => {
  let nearest = REGION_OPTIONS[0];
  let nearestDistance = Number.POSITIVE_INFINITY;
  REGION_OPTIONS.forEach((region) => {
    const coords = REGION_COORDS[region];
    if (!coords) {
      return;
    }
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

  const updateOrientationDeg = (value: number) => {
    const clamped = Math.min(360, Math.max(0, value));
    onChange({ ...project, orientation_deg: clamped });
  };

  const rounding = project.metadata.rounding ?? {
    occupancy: { mode: "round" },
    outdoor_air: { mode: "round", step: 10 },
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
    const selectedSolarRegion =
      Number.isFinite(lat) && Number.isFinite(lon)
        ? pickNearestSolarRegion(lat, lon)
        : project.solar_region;
    const selectedRegion =
      Number.isFinite(lat) && Number.isFinite(lon)
        ? pickNearestRegion(lat, lon)
        : project.region;

    onChange({
      ...project,
      location_lat: Number.isFinite(lat) ? lat : project.location_lat,
      location_lon: Number.isFinite(lon) ? lon : project.location_lon,
      location_label: result.display_name,
      building_location: result.display_name,
      region: matchedRegion ?? selectedRegion ?? project.region,
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
              label="日射地区 / Solar Region"
              value={project.solar_region}
              onChange={(v) => updateField("solar_region", v)}
              options={SOLAR_REGION_OPTIONS.map((r) => ({ value: r, label: r }))}
            />
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                方位角 [°] / Orientation Angle
              </label>
              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={project.orientation_deg}
                  onChange={(e) => updateOrientationDeg(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={360}
                    step={1}
                    value={project.orientation_deg}
                    onChange={(e) => updateOrientationDeg(Number(e.target.value))}
                    className="w-32 h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800"
                  />
                  <span className="text-xs text-slate-500">
                    北面からの時計回り角度（0°=北、90°=東、180°=南、270°=西）
                  </span>
                </div>
              </div>
            </div>
            <TextareaField
              label="備考"
              value={project.remarks}
              onChange={(v) => updateField("remarks", v)}
              placeholder="特記事項を入力"
            />
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
