// InsightsPanel.jsx
export function InsightsPanel({ insights = [], costs = {} }) {
  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-green-900 mb-4">✨ AI-powered insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-green-700 font-medium">Estimated weekly cost</p>
          <p className="text-2xl font-semibold text-green-900">£{costs.weekly?.toFixed(2)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <p className="text-xs text-amber-700 font-medium">Total monthly cost</p>
          <p className="text-2xl font-semibold text-amber-900">£{costs.monthly?.toFixed(2)}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {insights.map((ins, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-700">
            <span className="text-green-500 mt-0.5">•</span>
            <span>{ins}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default InsightsPanel;
