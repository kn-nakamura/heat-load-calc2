import { ChangeEvent, useState } from "react";
import {
  Upload,
  FileJson,
  FileText,
  ClipboardPaste,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  applyCsvImport,
  applyPasteImport,
  importJsonProject,
  previewCsvImport,
  previewPasteImport,
} from "../api/client";
import type { Project } from "../types";

type EntityType =
  | "rooms"
  | "surfaces"
  | "openings"
  | "constructions"
  | "glasses"
  | "internal_loads"
  | "mechanical_loads"
  | "ventilation";

interface BulkImportPanelProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  onIssues: (issues: Array<{ level: string; message: string }>) => void;
}

export default function BulkImportPanel({ project, onProjectChange, onIssues }: BulkImportPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [entity, setEntity] = useState<EntityType>("rooms");
  const [hasHeader, setHasHeader] = useState(true);
  const [deleteMissing, setDeleteMissing] = useState(false);
  const [csvFiles, setCsvFiles] = useState<FileList | null>(null);
  const [diffMessage, setDiffMessage] = useState("");

  const parseJsonImport = async () => {
    const parsed = JSON.parse(jsonText);
    const payload = parsed.project ? parsed.project : parsed;
    const res = await importJsonProject(payload);
    onProjectChange(res.project);
    onIssues(res.issues || []);
  };

  const loadCsvDatasets = async () => {
    const files = csvFiles ? Array.from(csvFiles) : [];
    return Promise.all(
      files.map(async (file) => ({ filename: file.name, content: await file.text() }))
    );
  };

  const onCsvPreview = async () => {
    const datasets = await loadCsvDatasets();
    const res = await previewCsvImport(project, datasets, hasHeader, deleteMissing);
    setDiffMessage(res.diffs.map((d) => `${d.entity}: +${d.add} / ~${d.update} / -${d.delete}`).join(" | "));
    onIssues(res.issues || []);
  };

  const onCsvApply = async () => {
    const datasets = await loadCsvDatasets();
    const res = await applyCsvImport(project, datasets, hasHeader, deleteMissing);
    onProjectChange(res.project);
    setDiffMessage(res.diffs.map((d) => `${d.entity}: +${d.add} / ~${d.update} / -${d.delete}`).join(" | "));
    onIssues(res.issues || []);
  };

  const onPastePreview = async () => {
    const res = await previewPasteImport(project, entity, pasteText, hasHeader, deleteMissing);
    setDiffMessage(res.diffs.map((d) => `${d.entity}: +${d.add} / ~${d.update} / -${d.delete}`).join(" | "));
    onIssues(res.issues || []);
  };

  const onPasteApply = async () => {
    const res = await applyPasteImport(project, entity, pasteText, hasHeader, deleteMissing);
    onProjectChange(res.project);
    setDiffMessage(res.diffs.map((d) => `${d.entity}: +${d.add} / ~${d.update} / -${d.delete}`).join(" | "));
    onIssues(res.issues || []);
  };

  const onCsvFiles = (e: ChangeEvent<HTMLInputElement>) => setCsvFiles(e.target.files);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Upload size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700">一括取込 (Bulk Import)</span>
          <span className="text-xs text-slate-400">CSV / JSON / Excel Paste</span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            {/* JSON Import */}
            <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <FileJson size={15} className="text-blue-500" />
                <h4 className="text-sm font-semibold text-slate-700">JSON Import</h4>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="project.json の内容を貼り付け"
                className="w-full min-h-[80px] p-2.5 text-xs font-mono border border-slate-300 rounded-lg resize-vertical bg-white text-slate-800 placeholder-slate-400"
              />
              <button
                type="button"
                onClick={parseJsonImport}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
              >
                <Check size={13} /> 適用
              </button>
            </div>

            {/* CSV Import */}
            <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={15} className="text-emerald-500" />
                <h4 className="text-sm font-semibold text-slate-700">CSV Import</h4>
              </div>
              <input
                type="file"
                multiple
                accept=".csv,text/csv"
                onChange={onCsvFiles}
                className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
              />
              <div className="flex gap-4 mt-3 text-xs text-slate-600">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasHeader}
                    onChange={(e) => setHasHeader(e.target.checked)}
                    className="rounded border-slate-300 text-primary-600"
                  />
                  ヘッダあり
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteMissing}
                    onChange={(e) => setDeleteMissing(e.target.checked)}
                    className="rounded border-slate-300 text-primary-600"
                  />
                  欠落IDを削除
                </label>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={onCsvPreview}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                >
                  <Eye size={13} /> プレビュー
                </button>
                <button
                  type="button"
                  onClick={onCsvApply}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                >
                  <Check size={13} /> 適用
                </button>
              </div>
            </div>

            {/* Paste Import */}
            <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardPaste size={15} className="text-purple-500" />
                <h4 className="text-sm font-semibold text-slate-700">Excel Paste (TSV)</h4>
              </div>
              <div className="mb-2">
                <label className="block text-xs text-slate-500 mb-1">対象エンティティ</label>
                <select
                  value={entity}
                  onChange={(e) => setEntity(e.target.value as EntityType)}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
                >
                  <option value="rooms">rooms (室)</option>
                  <option value="surfaces">surfaces (面)</option>
                  <option value="openings">openings (開口部)</option>
                  <option value="constructions">constructions (構造体)</option>
                  <option value="glasses">glasses (ガラス)</option>
                  <option value="internal_loads">internal_loads (内部発熱)</option>
                  <option value="mechanical_loads">mechanical_loads (機械負荷)</option>
                  <option value="ventilation">ventilation (換気)</option>
                </select>
              </div>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Excelからコピーしたデータを貼り付け"
                className="w-full min-h-[60px] p-2.5 text-xs font-mono border border-slate-300 rounded-lg resize-vertical bg-white text-slate-800 placeholder-slate-400"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={onPastePreview}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                >
                  <Eye size={13} /> プレビュー
                </button>
                <button
                  type="button"
                  onClick={onPasteApply}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                >
                  <Check size={13} /> 適用
                </button>
              </div>
            </div>
          </div>

          {diffMessage && (
            <div className="mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-xs text-emerald-700 font-medium">Diff: {diffMessage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
