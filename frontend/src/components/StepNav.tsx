import {
  Settings,
  MapPin,
  Thermometer,
  GlassWater,
  DoorOpen,
  Network,
  BarChart3,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import type { ReactNode } from "react";

export interface StepDef {
  key: string;
  label: string;
  sublabel: string;
  icon: ReactNode;
}

export const STEPS: StepDef[] = [
  { key: "design", label: "設計条件", sublabel: "Design Conditions", icon: <Settings size={18} /> },
  { key: "region", label: "地区データ", sublabel: "Region Data", icon: <MapPin size={18} /> },
  { key: "indoor", label: "屋内データ", sublabel: "Indoor Data", icon: <Thermometer size={18} /> },
  { key: "glass", label: "窓ガラス・構造体", sublabel: "Glass & Structure", icon: <GlassWater size={18} /> },
  { key: "rooms", label: "室登録", sublabel: "Room Registration", icon: <DoorOpen size={18} /> },
  { key: "systems", label: "系統登録", sublabel: "System Registration", icon: <Network size={18} /> },
  { key: "results", label: "負荷確認", sublabel: "Load Check & Export", icon: <BarChart3 size={18} /> },
];

interface StepNavProps {
  currentStep: number;
  issuesCount: number;
  onSelectStep: (index: number) => void;
}

export default function StepNav({ currentStep, issuesCount, onSelectStep }: StepNavProps) {
  return (
    <aside className="w-72 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col border-r border-slate-700/50">
      {/* Logo area */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Heat Load Calc
        </h1>
        <p className="text-sm text-slate-400 mt-1">熱負荷計算 Web MVP</p>
      </div>

      {/* Issues badge */}
      {issuesCount > 0 && (
        <div className="mx-4 mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="text-amber-400 shrink-0" />
          <span className="text-xs text-amber-300">
            {issuesCount} 件のバリデーション警告
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-6">
        <ul className="space-y-1">
          {STEPS.map((step, idx) => {
            const isActive = idx === currentStep;
            const isPast = idx < currentStep;
            return (
              <li key={step.key}>
                <button
                  type="button"
                  onClick={() => onSelectStep(idx)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200
                    ${isActive
                      ? "bg-primary-600/20 text-white border border-primary-500/30 shadow-lg shadow-primary-900/20"
                      : isPast
                        ? "text-slate-300 hover:bg-slate-700/50 hover:text-white border border-transparent"
                        : "text-slate-400 hover:bg-slate-700/30 hover:text-slate-200 border border-transparent"
                    }
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all
                    ${isActive
                      ? "bg-primary-500 text-white shadow-md"
                      : isPast
                        ? "bg-slate-600 text-slate-200"
                        : "bg-slate-700/50 text-slate-500"
                    }
                  `}>
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{step.label}</div>
                    <div className={`text-[11px] truncate ${isActive ? "text-primary-300" : "text-slate-500"}`}>
                      {step.sublabel}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight size={14} className="text-primary-400 shrink-0" />
                  )}
                </button>

                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div className="flex justify-start pl-6 py-0.5">
                    <div className={`w-px h-2 ${isPast ? "bg-slate-600" : "bg-slate-700/30"}`} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700/50">
        <p className="text-[11px] text-slate-500">v0.1.0 MVP</p>
      </div>
    </aside>
  );
}
