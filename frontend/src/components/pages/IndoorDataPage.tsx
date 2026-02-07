import { useMemo } from "react";
import type { ColDef, ValueParserParams } from "ag-grid-community";
import { Thermometer } from "lucide-react";
import GridEditor from "../GridEditor";
import type { Project, DesignCondition, InternalLoad } from "../../types";

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

const createEmptyCondition = () =>
  ({
    id: "",
    season: "",
    indoor_temp_c: "",
    indoor_rh_pct: "",
  } as unknown as DesignCondition);

const createEmptyInternalLoad = () =>
  ({ id: "", room_id: "", kind: "", sensible_w: "", latent_w: "" } as unknown as InternalLoad);

export default function IndoorDataPage({ project, onChange }: Props) {
  const columns = useMemo<ColDef<DesignCondition>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 120 },
      {
        field: "season",
        headerName: "期間 / Season",
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["summer", "winter"] },
        minWidth: 130,
      },
      {
        field: "indoor_temp_c",
        headerName: "乾球温度 [°C]",
        valueParser: numberParser,
        minWidth: 130,
      },
      {
        field: "indoor_rh_pct",
        headerName: "相対湿度 [%]",
        valueParser: numberParser,
        minWidth: 130,
      },
    ],
    []
  );

  const internalLoadColumns = useMemo<ColDef<InternalLoad>[]>(
    () => [
      { field: "id", headerName: "ID", minWidth: 100 },
      { field: "room_id", headerName: "室ID", minWidth: 110 },
      {
        field: "kind",
        headerName: "種別",
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["lighting", "occupancy", "equipment"] },
        minWidth: 120,
      },
      { field: "sensible_w", headerName: "顕熱 [W]", valueParser: numberParser, minWidth: 110 },
      { field: "latent_w", headerName: "潜熱 [W]", valueParser: numberParser, minWidth: 110 },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Thermometer size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-slate-800">設計用屋内条件</h3>
          <span className="text-xs text-slate-400">Indoor Design Conditions</span>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-4">
            各室の夏期・冬期における室内設計温湿度を設定します。下のグリッドで直接編集するか、Excelからコピー＆ペーストできます。
          </p>

          {/* Quick summary */}
          {project.design_conditions.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-5">
              {project.design_conditions
                .filter((dc) => dc.season && dc.indoor_temp_c != null)
                .map((dc) => (
                  <div
                    key={dc.id}
                    className={`p-3 rounded-lg border ${
                      dc.season === "summer"
                        ? "bg-orange-50/50 border-orange-200/50"
                        : "bg-blue-50/50 border-blue-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          dc.season === "summer" ? "bg-orange-400" : "bg-blue-400"
                        }`}
                      />
                      <span className="text-xs font-medium text-slate-700">
                        {dc.season === "summer" ? "夏期" : "冬期"} ({dc.id})
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-slate-600">{dc.indoor_temp_c}°C</span>
                      <span className="text-slate-600">{dc.indoor_rh_pct}%RH</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      <GridEditor
        title="屋内設計条件テーブル"
        hint="Indoor Conditions Table - click cells to edit"
        rows={project.design_conditions}
        columns={columns}
        createEmptyRow={createEmptyCondition}
        onChange={(rows) => onChange({ ...project, design_conditions: rows })}
        height="360px"
      />

      <GridEditor
        title="内部発熱（照明・人体・機器）"
        hint="室IDごとに照明・人体・機器の発熱量を入力します。"
        rows={project.internal_loads}
        columns={internalLoadColumns}
        createEmptyRow={createEmptyInternalLoad}
        onChange={(rows) => onChange({ ...project, internal_loads: rows })}
        height="360px"
      />
    </div>
  );
}
