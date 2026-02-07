import axios from "axios";
import type { CalcResult, Project } from "../types";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_ORIGIN}/v1`
});

export const runCalculation = async (project: Project): Promise<CalcResult> => {
  const response = await api.post("/calc/run", { project });
  return response.data as CalcResult;
};

export const validateProject = async (project: Project) => {
  const response = await api.post("/projects/validate", project);
  return response.data;
};

export const exportJson = async (project: Project, calcResult: CalcResult | null) => {
  const response = await api.post("/export/json", {
    project,
    calc_result: calcResult
  });
  return response.data.payload;
};

export const exportExcel = async (project: Project, calcResult: CalcResult | null) => {
  const response = await api.post(
    "/export/excel",
    {
      project,
      calc_result: calcResult,
      output_filename: "heat_load_result.xlsx"
    },
    { responseType: "blob" }
  );
  return response.data as Blob;
};

export const importJsonProject = async (payload: unknown) => {
  const response = await api.post("/import/json", { payload });
  return response.data as { project: Project; issues: Array<{ level: string; message: string }> };
};

export const previewCsvImport = async (
  project: Project,
  datasets: Array<{ filename: string; content: string }>,
  hasHeader = true,
  deleteMissing = false
) => {
  const response = await api.post("/import/csv/preview", {
    project,
    datasets,
    has_header: hasHeader,
    delete_missing: deleteMissing
  });
  return response.data as {
    diffs: Array<{ entity: string; add: number; update: number; delete: number }>;
    issues: Array<{ level: string; message: string }>;
  };
};

export const applyCsvImport = async (
  project: Project,
  datasets: Array<{ filename: string; content: string }>,
  hasHeader = true,
  deleteMissing = false
) => {
  const response = await api.post("/import/csv/apply", {
    project,
    datasets,
    has_header: hasHeader,
    delete_missing: deleteMissing
  });
  return response.data as {
    project: Project;
    diffs: Array<{ entity: string; add: number; update: number; delete: number }>;
    issues: Array<{ level: string; message: string }>;
  };
};

export const previewPasteImport = async (
  project: Project,
  entity:
    | "rooms"
    | "surfaces"
    | "openings"
    | "constructions"
    | "glasses"
    | "internal_loads"
    | "mechanical_loads"
    | "ventilation",
  text: string,
  hasHeader = true,
  deleteMissing = false
) => {
  const response = await api.post("/import/paste/preview", {
    project,
    entity,
    text,
    has_header: hasHeader,
    delete_missing: deleteMissing
  });
  return response.data as {
    diffs: Array<{ entity: string; add: number; update: number; delete: number }>;
    issues: Array<{ level: string; message: string }>;
  };
};

export const applyPasteImport = async (
  project: Project,
  entity:
    | "rooms"
    | "surfaces"
    | "openings"
    | "constructions"
    | "glasses"
    | "internal_loads"
    | "mechanical_loads"
    | "ventilation",
  text: string,
  hasHeader = true,
  deleteMissing = false
) => {
  const response = await api.post("/import/paste/apply", {
    project,
    entity,
    text,
    has_header: hasHeader,
    delete_missing: deleteMissing
  });
  return response.data as {
    project: Project;
    diffs: Array<{ entity: string; add: number; update: number; delete: number }>;
    issues: Array<{ level: string; message: string }>;
  };
};

export default api;
