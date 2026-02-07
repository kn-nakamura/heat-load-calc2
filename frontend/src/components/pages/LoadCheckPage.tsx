import { useState } from "react";
import {
  BarChart3,
  Play,
  Download,
  FileJson,
  FileSpreadsheet,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { Project, CalcResult } from "../../types";
import { exportExcel, exportJson, runCalculation, validateProject } from "../../api/client";

interface Props {
  project: Project;
  calcResult: CalcResult | null;
  onCalcResult: (result: CalcResult) => void;
  issues: Array<{ message: string; level: string }>;
  onIssues: (issues: Array<{ message: string; level: string }>) => void;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, filename);
}

export default function LoadCheckPage({ project, calcResult, onCalcResult, issues, onIssues }: Props) {
  const [busy, setBusy] = useState(false);
  const [expandedTraces, setExpandedTraces] = useState<Set<number>>(new Set());

  const handleRunCalc = async () => {
    setBusy(true);
    try {
      const validation = await validateProject(project);
      onIssues(validation.issues || []);
      if (!validation.valid) return;
      const result = await runCalculation(project);
      onCalcResult(result);
    } catch (err) {
      onIssues([{ level: "error", message: `計算エラー: ${err instanceof Error ? err.message : String(err)}` }]);
    } finally {
      setBusy(false);
    }
  };

  const handleExportJson = async () => {
    setBusy(true);
    try {
      const payload = await exportJson(project, calcResult);
      downloadJson(payload, "project.json");
    } finally {
      setBusy(false);
    }
  };

  const handleExportExcel = async () => {
    setBusy(true);
    try {
      const blob = await exportExcel(project, calcResult);
      downloadBlob(blob, "heat_load_result.xlsx");
    } finally {
      setBusy(false);
    }
  };

  const toggleTrace = (idx: number) => {
    setExpandedTraces((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <BarChart3 size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-slate-800">負荷確認・出力</h3>
          <span className="text-xs text-slate-400">Load Check & Export</span>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRunCalc}
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-xl shadow-md shadow-primary-600/20 transition-all"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              計算実行
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              disabled={busy || !calcResult}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 rounded-xl transition-all"
            >
              <FileJson size={16} />
              JSON出力
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={busy || !calcResult}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl shadow-sm transition-all"
            >
              <FileSpreadsheet size={16} />
              Excel出力
            </button>
          </div>
        </div>
      </section>

      {/* Issues */}
      {issues.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <h4 className="text-sm font-semibold text-amber-800">バリデーション結果</h4>
          </div>
          <ul className="space-y-1">
            {issues.map((issue, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  issue.level === "error" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {issue.level.toUpperCase()}
                </span>
                <span className="text-slate-700">{issue.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Results */}
      {calcResult && (
        <>
          {/* Totals */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <CheckCircle2 size={16} className="text-accent-600" />
              <h3 className="text-sm font-semibold text-slate-800">計算結果サマリ</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(calcResult.totals).map(([key, val]) => (
                  <div key={key} className="p-3 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl">
                    <div className="text-xs text-slate-500 font-medium">{key.replace(/_/g, " ")}</div>
                    <div className="text-xl font-bold text-slate-800 mt-1 tabular-nums">
                      {Math.round(val).toLocaleString()}
                      <span className="text-xs text-slate-400 ml-1 font-normal">W</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Major Cells */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">主要セル (Major Cells)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Excel出力時のセル対応値</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-2.5 border-b border-slate-200 text-slate-600 font-semibold">Cell</th>
                    <th className="text-right px-4 py-2.5 border-b border-slate-200 text-slate-600 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(calcResult.major_cells).map(([cell, value]) => (
                    <tr key={cell} className="hover:bg-slate-50/70 border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-2 font-mono text-xs text-slate-700">{cell}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs text-slate-800 tabular-nums">
                        {value != null ? Number(value).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Traces */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">計算根拠 (Calculation Trace)</h3>
              <p className="text-xs text-slate-400 mt-0.5">各計算ステップの入出力を確認できます</p>
            </div>
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {calcResult.traces.map((trace, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleTrace(idx)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                  >
                    {expandedTraces.has(idx) ? (
                      <ChevronDown size={14} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={14} className="text-slate-400" />
                    )}
                    <span className="text-xs font-mono text-primary-700">{trace.formula_id}</span>
                    <span className="text-xs text-slate-400">/</span>
                    <span className="text-xs text-slate-600">{trace.entity_type}</span>
                    <span className="text-xs text-slate-400">/</span>
                    <span className="text-xs text-slate-600">{trace.entity_id}</span>
                  </button>
                  {expandedTraces.has(idx) && (
                    <div className="px-4 pb-3">
                      <pre className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 overflow-auto max-h-60 border border-slate-100">
                        {JSON.stringify(trace, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {!calcResult && (
        <div className="text-center py-16">
          <Download size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">計算を実行すると、ここに結果が表示されます。</p>
          <p className="text-xs text-slate-400 mt-1">Run calculation to see results here.</p>
        </div>
      )}
    </div>
  );
}
