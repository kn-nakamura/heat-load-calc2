import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StepNav, { STEPS } from "./components/StepNav";
import BulkImportPanel from "./components/BulkImportPanel";
import DesignConditionsPage from "./components/pages/DesignConditionsPage";
import RegionDataPage from "./components/pages/RegionDataPage";
import IndoorDataPage from "./components/pages/IndoorDataPage";
import GlassStructurePage from "./components/pages/GlassStructurePage";
import RoomRegistrationPage from "./components/pages/RoomRegistrationPage";
import SystemRegistrationPage from "./components/pages/SystemRegistrationPage";
import LoadCheckPage from "./components/pages/LoadCheckPage";
import type { CalcResult, Project } from "./types";

const defaultProject: Project = {
  id: "project-1",
  name: "新規プロジェクト",
  building_name: "",
  building_location: "",
  building_usage: "",
  building_structure: "",
  total_floor_area_m2: null,
  floors_above: null,
  floors_below: null,
  report_author: "",
  remarks: "",
  unit_system: "SI",
  region: "東京",
  solar_region: "東京",
  orientation_basis: "north",
  orientation_deg: 0,
  location_lat: null,
  location_lon: null,
  location_label: "",
  design_conditions: [
    { id: "dc-summer", season: "summer", indoor_temp_c: 26, indoor_rh_pct: 50 },
    { id: "dc-winter", season: "winter", indoor_temp_c: 22, indoor_rh_pct: 40 },
  ],
  rooms: [],
  surfaces: [],
  openings: [],
  constructions: [],
  glasses: [],
  internal_loads: [],
  mechanical_loads: [],
  ventilation_infiltration: [],
  systems: [],
  metadata: {
    correction_factors: {
      cool_9: 1.1,
      cool_12: 1.1,
      cool_14: 1.1,
      cool_16: 1.1,
      cool_latent: 1.0,
      heat_sensible: 1.1,
      heat_latent: 1.0,
    },
    rounding: {
      occupancy: {
        mode: "round",
      },
      outdoor_air: {
        mode: "round",
        step: 10,
      },
    },
  },
};

export default function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [project, setProject] = useState<Project>(defaultProject);
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [issues, setIssues] = useState<Array<{ message: string; level: string }>>([]);

  const currentStep = STEPS[stepIndex];

  const renderPage = () => {
    switch (stepIndex) {
      case 0:
        return <DesignConditionsPage project={project} onChange={setProject} />;
      case 1:
        return <RegionDataPage project={project} />;
      case 2:
        return <IndoorDataPage project={project} onChange={setProject} />;
      case 3:
        return <GlassStructurePage project={project} onChange={setProject} />;
      case 4:
        return <RoomRegistrationPage project={project} onChange={setProject} />;
      case 5:
        return <SystemRegistrationPage project={project} onChange={setProject} />;
      case 6:
        return (
          <LoadCheckPage
            project={project}
            calcResult={calcResult}
            onCalcResult={setCalcResult}
            issues={issues}
            onIssues={setIssues}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col md:flex-row">
      {/* Sidebar */}
      <div className="hidden md:block">
        <StepNav
          currentStep={stepIndex}
          issuesCount={issues.length}
          onSelectStep={setStepIndex}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-xs font-mono text-slate-400">
                  STEP {stepIndex + 1}/{STEPS.length}
                </span>
                <h2 className="text-lg font-bold text-slate-900">{currentStep.label}</h2>
                <span className="text-sm text-slate-400">{currentStep.sublabel}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {project.name} — {project.region}
              </p>
            </div>

            {/* Step navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
              >
                <ChevronLeft size={16} />
                戻る
              </button>
              <button
                type="button"
                disabled={stepIndex === STEPS.length - 1}
                onClick={() => setStepIndex((s) => s + 1)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
              >
                次へ
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="mt-4 md:hidden space-y-3">
            {issues.length > 0 && (
              <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                {issues.length} 件のバリデーション警告
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STEPS.map((step, idx) => {
                const isActive = idx === stepIndex;
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setStepIndex(idx)}
                    className={`shrink-0 px-3 py-2 rounded-full text-xs font-medium border transition-all ${
                      isActive
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {idx + 1}. {step.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6 overflow-y-auto">
          {/* Bulk import panel (collapsible) */}
          <BulkImportPanel
            project={project}
            onProjectChange={setProject}
            onIssues={setIssues}
          />

          {/* Step-specific content */}
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
