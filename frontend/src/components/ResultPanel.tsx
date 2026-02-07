import type { CalcResult } from "../types";

interface ResultPanelProps {
  result: CalcResult | null;
}

export default function ResultPanel({ result }: ResultPanelProps) {
  if (!result) {
    return <p className="hint">計算未実行です。負荷確認ステップで実行してください。</p>;
  }

  return (
    <section className="result-wrap">
      <h3>主要結果</h3>
      <div className="summary-grid">
        {Object.entries(result.totals).map(([k, v]) => (
          <article key={k} className="summary-card">
            <h4>{k}</h4>
            <p>{Math.round(v).toLocaleString()} W</p>
          </article>
        ))}
      </div>

      <h3>主要セル一致確認用</h3>
      <table className="major-cell-table">
        <thead>
          <tr>
            <th>セル</th>
            <th>値</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(result.major_cells).map(([cell, value]) => (
            <tr key={cell}>
              <td>{cell}</td>
              <td>{value ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>計算根拠 (Trace)</h3>
      <div className="trace-list">
        {result.traces.map((trace, idx) => (
          <details key={`${trace.entity_id}-${idx}`}>
            <summary>
              {trace.formula_id} / {trace.entity_type} / {trace.entity_id}
            </summary>
            <pre>{JSON.stringify(trace, null, 2)}</pre>
          </details>
        ))}
      </div>
    </section>
  );
}
