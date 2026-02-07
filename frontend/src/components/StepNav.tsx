interface StepNavProps {
  steps: string[];
  currentStep: number;
  issuesCount: number;
  onSelectStep: (index: number) => void;
}

export default function StepNav({ steps, currentStep, issuesCount, onSelectStep }: StepNavProps) {
  return (
    <aside className="step-nav">
      <h1>Heat Load Calc</h1>
      <p className="subtitle">国土交通省方式 / Web MVP</p>
      <div className="issue-chip">未解決エラー: {issuesCount}</div>
      <ul>
        {steps.map((step, idx) => (
          <li key={step}>
            <button
              className={idx === currentStep ? "active" : ""}
              type="button"
              onClick={() => onSelectStep(idx)}
            >
              <span>{idx + 1}</span>
              {step}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
