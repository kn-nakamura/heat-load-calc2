import { useMemo } from "react";
import type { ColDef } from "ag-grid-community";
import { Network, Info } from "lucide-react";
import GridEditor from "../GridEditor";
import type { Project, SystemEntity } from "../../types";

interface Props {
  project: Project;
  onChange: (project: Project) => void;
}

const createEmptySystem = () =>
  ({ id: "", name: "", room_ids: "" } as unknown as SystemEntity);

export default function SystemRegistrationPage({ project, onChange }: Props) {
  const systemColumns = useMemo<ColDef<SystemEntity>[]>(
    () => [
      { field: "id", headerName: "系統ID", minWidth: 120 },
      { field: "name", headerName: "系統名称", minWidth: 200 },
      { field: "room_ids", headerName: "室ID (カンマ区切り)", minWidth: 260 },
    ],
    []
  );

  const handleSystemChange = (rows: SystemEntity[]) => {
    const systems = rows.map((row) => ({
      ...row,
      room_ids: (() => {
        const raw = (row as unknown as { room_ids: unknown }).room_ids;
        if (typeof raw === "string") {
          return raw.split(",").map((x) => x.trim()).filter(Boolean);
        }
        return Array.isArray(raw) ? (raw as string[]) : [];
      })(),
    }));
    onChange({ ...project, systems });
  };

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Network size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-slate-800">系統登録</h3>
          <span className="text-xs text-slate-400">System Registration</span>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-200/50 rounded-lg">
            <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">系統（空調系統）の設定</p>
              <p>
                各系統にIDと名称を設定し、所属する室IDをカンマ区切りで入力してください。
                系統ごとに負荷が集計され、計算結果で系統別集計として表示されます。
              </p>
            </div>
          </div>

          {/* Current summary */}
          {project.systems.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {project.systems.map((sys) => (
                <div key={sys.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-sm font-medium text-slate-800">{sys.name || sys.id}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    ID: {sys.id} / 室数: {Array.isArray(sys.room_ids) ? sys.room_ids.length : 0}
                  </div>
                  {Array.isArray(sys.room_ids) && sys.room_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sys.room_ids.map((rid) => (
                        <span key={rid} className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-md">
                          {rid}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <GridEditor
        title="系統テーブル (Systems)"
        hint="系統ID、名称、所属する室IDをカンマ区切りで入力"
        rows={project.systems}
        columns={systemColumns}
        createEmptyRow={createEmptySystem}
        onChange={handleSystemChange}
        height="400px"
      />
    </div>
  );
}
