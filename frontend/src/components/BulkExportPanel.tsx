import { useEffect, useRef, useState } from "react";
import { Upload, FileJson, FileSpreadsheet } from "lucide-react";
import type { CalcResult, Project } from "../types";
import { exportExcel, exportJson } from "../api/client";

interface BulkExportPanelProps {
  project: Project;
  calcResult: CalcResult | null;
  variant?: "menu" | "panel";
  triggerLabel?: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
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

export default function BulkExportPanel({
  project,
  calcResult,
  variant = "panel",
  triggerLabel = "データエクスポート",
  isOpen,
  onToggle,
}: BulkExportPanelProps) {
  const [isExpandedState, setIsExpandedState] = useState(false);
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isExpanded = isOpen ?? isExpandedState;
  const setExpanded = onToggle ?? setIsExpandedState;

  useEffect(() => {
    if (!isExpanded) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isExpanded, setExpanded]);

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
    if (!calcResult) return;
    setBusy(true);
    try {
      const blob = await exportExcel(project, calcResult);
      downloadBlob(blob, "heat_load_result.xlsx");
    } finally {
      setBusy(false);
    }
  };

  const panelClasses =
    variant === "menu"
      ? "absolute left-0 top-full mt-2 w-[min(92vw,360px)] bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-20 sm:left-auto sm:right-0"
      : "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden";

  return (
    <div ref={panelRef} className={variant === "menu" ? "relative" : ""}>
      <button
        type="button"
        onClick={() => setExpanded(!isExpanded)}
        aria-label={triggerLabel}
        className={
          variant === "menu"
        {isExpanded ? (
          <span className="text-xs text-slate-400 hidden sm:inline">閉じる</span>
        ) : null}
      >
        <div className="flex items-center gap-2">
          <Upload size={16} className="text-slate-500" />
          <span className={variant === "menu" ? "text-sm" : "text-sm font-medium text-slate-700"}>
            <span className={variant === "menu" ? "hidden sm:inline" : ""}>
              {variant === "menu" ? triggerLabel : "データエクスポート (Export)"}
            </span>
          </span>
          {variant === "menu" ? null : (
            <span className="text-xs text-slate-400">JSON / Excel</span>
          )}
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          {isExpanded ? "閉じる" : "開く"}
        </span>
      </button>

      {isExpanded && (
        <div className={panelClasses}>
          <div className="px-5 py-4 border-t border-slate-100 space-y-3">
            <p className="text-xs text-slate-500">
              {calcResult
                ? "計算結果を含めたデータを出力できます。"
                : "JSONは出力可能です。Excelは計算後に出力できます。"}
            </p>
            <button
              type="button"
              onClick={handleExportJson}
              disabled={busy}
              className="w-full inline-flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 rounded-lg transition-all"
            >
              <span className="inline-flex items-center gap-2">
                <FileJson size={16} /> JSON出力
              </span>
              <span className="text-xs text-slate-400">project.json</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={!calcResult || busy}
              className="w-full inline-flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg shadow-sm transition-all"
            >
              <span className="inline-flex items-center gap-2">
                <FileSpreadsheet size={16} /> Excel出力
              </span>
              <span className="text-xs text-emerald-100">heat_load_result.xlsx</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
