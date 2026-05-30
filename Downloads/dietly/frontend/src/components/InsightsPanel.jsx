export default function InsightsPanel({ insights = [], costs = {}, people = 1, preference = "mixed" }) {
  const prefLabel = { veg: "Vegetarian", nonveg: "Non-Vegetarian", mixed: "Mixed" }[preference] || preference;

  const stats = [
    {
      label: "Weekly Cost",
      value: `£${costs.weekly?.toFixed(2) ?? "—"}`,
      sub: `£${((costs.weekly ?? 0) / people).toFixed(2)} per person`,
      accent: "#d4a853",
      glow: "rgba(212,168,83,0.12)",
    },
    {
      label: "Monthly Total",
      value: `£${costs.monthly?.toFixed(2) ?? "—"}`,
      sub: `All ${people} ${people === 1 ? "person" : "people"} included`,
      accent: "#10b981",
      glow: "rgba(16,185,129,0.10)",
    },
    {
      label: "Daily Budget",
      value: `£${((costs.monthly ?? 0) / 30).toFixed(2)}`,
      sub: "Per day for everyone",
      accent: "#818cf8",
      glow: "rgba(129,140,248,0.10)",
    },
    {
      label: "Diet Type",
      value: prefLabel,
      sub: "Your preference",
      accent: "#f472b6",
      glow: "rgba(244,114,182,0.10)",
    },
  ];

  return (
    <div className="mt-8 space-y-5 fade-up">

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="glass rounded-2xl p-5"
            style={{ borderColor: `${s.accent}22`, boxShadow: `0 0 40px ${s.glow}` }}
          >
            <p
              className="text-[11px] font-medium uppercase tracking-wider mb-2"
              style={{ color: `${s.accent}99` }}
            >
              {s.label}
            </p>
            <p className="text-2xl font-bold leading-none mb-1.5" style={{ color: "var(--text)" }}>
              {s.value}
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* AI insights */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
            style={{ background: "rgba(212,168,83,0.15)", border: "1px solid rgba(212,168,83,0.25)" }}
          >
            ✦
          </div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
            AI Nutritional Insights
          </h3>
        </div>
        <div className="space-y-3">
          {insights.map((ins, i) => (
            <div key={i} className="flex gap-3 group">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                style={{
                  background: "rgba(212,168,83,0.12)",
                  color: "#d4a853",
                  border: "1px solid rgba(212,168,83,0.2)",
                }}
              >
                {i + 1}
              </div>
              <p
                className="text-sm leading-relaxed transition-colors duration-200"
                style={{ color: "var(--text-2)" }}
              >
                {ins}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
