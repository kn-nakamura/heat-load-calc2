import { ChangeEvent, useState } from "react";
import {
  applyCsvImport,
  applyPasteImport,
  importJsonProject,
  previewCsvImport,
  previewPasteImport
} from "../api/client";
import type { Project } from "../types";

type EntityType =
  | "rooms"
  | "surfaces"
  | "openings"
  | "constructions"
  | "glasses"
  | "internal_loads"
  | "ventilation";

interface BulkImportPanelProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  onIssues: (issues: Array<{ level: string; message: string }>) => void;
}

export default function BulkImportPanel({ project, onProjectChange, onIssues }: BulkImportPanelProps) {
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
    const datasets = await Promise.all(
      files.map(async (file) => ({
        filename: file.name,
        content: await file.text()
      }))
    );
    return datasets;
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

  const onCsvFiles = (e: ChangeEvent<HTMLInputElement>) => {
    setCsvFiles(e.target.files);
  };

  return (
    <section className="card import-panel">
      <h3>一括入力 (CSV / JSON / Excelコピペ)</h3>
      <div className="import-grid">
        <article>
          <h4>JSON取込</h4>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="project.json を貼り付け"
          />
          <button type="button" onClick={parseJsonImport}>
            JSON適用
          </button>
        </article>

        <article>
          <h4>CSV取込</h4>
          <input type="file" multiple accept=".csv,text/csv" onChange={onCsvFiles} />
          <div className="inline-options">
            <label>
              <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
              ヘッダーあり
            </label>
            <label>
              <input
                type="checkbox"
                checked={deleteMissing}
                onChange={(e) => setDeleteMissing(e.target.checked)}
              />
              未掲載IDを削除
            </label>
          </div>
          <div className="btn-row">
            <button type="button" onClick={onCsvPreview}>
              プレビュー
            </button>
            <button type="button" onClick={onCsvApply}>
              適用
            </button>
          </div>
        </article>

        <article>
          <h4>Excelコピペ (TSV)</h4>
          <label>
            エンティティ
            <select value={entity} onChange={(e) => setEntity(e.target.value as EntityType)}>
              <option value="rooms">rooms</option>
              <option value="surfaces">surfaces</option>
              <option value="openings">openings</option>
              <option value="constructions">constructions</option>
              <option value="glasses">glasses</option>
              <option value="internal_loads">internal_loads</option>
              <option value="ventilation">ventilation</option>
            </select>
          </label>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Excelからコピーした範囲を貼り付け"
          />
          <div className="btn-row">
            <button type="button" onClick={onPastePreview}>
              プレビュー
            </button>
            <button type="button" onClick={onPasteApply}>
              適用
            </button>
          </div>
        </article>
      </div>
      {diffMessage && <p className="diff-message">差分: {diffMessage}</p>}
    </section>
  );
}
