import { useState } from "react";

const PRESETS = [
  { label: "No non-veg on Saturday", icon: "🚫" },
  { label: "No eggs on Tuesday & Saturday", icon: "🥚" },
  { label: "No meat on Tuesday & Saturday", icon: "🥩" },
  { label: "Non-veg mandatory on Sunday", icon: "🍖" },
  { label: "Dairy-free", icon: "🥛" },
  { label: "Gluten-free", icon: "🌾" },
];

const DIET_OPTIONS = [
  { value: "veg",    label: "Vegetarian", icon: "🥦", desc: "100% plant-based" },
  { value: "mixed",  label: "Mixed",       icon: "🍽", desc: "Balanced variety" },
  { value: "nonveg", label: "Non-Veg",     icon: "🍗", desc: "Includes meat & fish" },
];

export default function MealPlanForm({ onGenerate, loading }) {
  const [budget, setBudget] = useState(80);
  const [preference, setPreference] = useState("mixed");
  const [people, setPeople] = useState(1);
  const [restrictions, setRestrictions] = useState([]);
  const [customInput, setCustomInput] = useState("");

  const togglePreset = (label) =>
    setRestrictions((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );

  const addCustom = () => {
    const t = customInput.trim();
    if (t && !restrictions.includes(t)) setRestrictions((prev) => [...prev, t]);
    setCustomInput("");
  };

  const remove = (r) => setRestrictions((prev) => prev.filter((x) => x !== r));
  const handleKey = (e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } };
  const handleSubmit = () => onGenerate({ monthly_budget: budget, preference, people, restrictions });

  return (
    <div className="glass rounded-2xl p-7 fade-up">

      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ background: "rgba(212,168,83,0.15)", border: "1px solid rgba(212,168,83,0.25)" }}
        >
          ✦
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Configure your meal plan
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Set your preferences and let AI do the rest
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Budget */}
        <div className="space-y-3">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Monthly Budget
          </label>
          <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-bold gold-text">£{budget}</span>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>/month</span>
            </div>
            <input type="range" min={30} max={500} step={5} value={budget}
              onChange={(e) => setBudget(Number(e.target.value))} />
            <div className="flex justify-between mt-2">
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                £{(budget / 4).toFixed(0)}/wk
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                £{(budget / people / 30).toFixed(1)}/day per person
              </span>
            </div>
          </div>
        </div>

        {/* Diet preference */}
        <div className="space-y-3">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Diet Preference
          </label>
          <div className="space-y-2">
            {DIET_OPTIONS.map((opt) => {
              const active = preference === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setPreference(opt.value)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
                  style={{
                    background: active ? "rgba(212,168,83,0.1)" : "var(--surface)",
                    border: `1px solid ${active ? "rgba(212,168,83,0.4)" : "var(--border)"}`,
                  }}
                >
                  <span className="text-base">{opt.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: active ? "#f0c978" : "var(--text-2)" }}>
                      {opt.label}
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--text-3)" }}>{opt.desc}</div>
                  </div>
                  {active && <span className="text-xs" style={{ color: "#d4a853" }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* People */}
        <div className="space-y-3">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Number of People
          </label>
          <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-bold" style={{ color: "var(--text)" }}>{people}</span>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                {people === 1 ? "person" : "people"}
              </span>
            </div>
            <input type="range" min={1} max={10} step={1} value={people}
              onChange={(e) => setPeople(Number(e.target.value))} />
            <div className="flex justify-between mt-2">
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>Min 1</span>
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>Max 10</span>
            </div>
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--divider)" }}>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                Budget per person:{" "}
                <span style={{ color: "rgba(212,168,83,0.75)" }}>£{(budget / people).toFixed(0)}/month</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Restrictions */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Dietary Restrictions
          </label>
          {restrictions.length > 0 && (
            <span className="text-[11px]" style={{ color: "rgba(212,168,83,0.65)" }}>
              {restrictions.length} active
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map(({ label, icon }) => {
            const active = restrictions.includes(label);
            return (
              <button
                key={label}
                onClick={() => togglePreset(label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: active ? "rgba(212,168,83,0.12)" : "var(--surface)",
                  border: `1px solid ${active ? "rgba(212,168,83,0.35)" : "var(--border)"}`,
                  color: active ? "#f0c978" : "var(--text-2)",
                }}
              >
                <span>{icon}</span>
                {label}
                {active && <span className="ml-0.5" style={{ color: "#d4a853" }}>✓</span>}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Add a custom restriction — e.g. No seafood on Friday…"
            className="input-dark flex-1"
          />
          <button
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-30"
            style={{
              background: "rgba(212,168,83,0.15)",
              border: "1px solid rgba(212,168,83,0.3)",
              color: "#f0c978",
            }}
          >
            + Add
          </button>
        </div>

        {restrictions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {restrictions.map((r) => (
              <span
                key={r}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                style={{
                  background: "rgba(212,168,83,0.10)",
                  border: "1px solid rgba(212,168,83,0.22)",
                  color: "rgba(240,201,120,0.85)",
                }}
              >
                {r}
                <button
                  onClick={() => remove(r)}
                  className="ml-0.5 font-bold transition-colors"
                  style={{ color: "rgba(212,168,83,0.45)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(212,168,83,0.45)")}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`btn-gold w-full py-4 rounded-xl text-sm tracking-wide ${loading ? "loading" : ""}`}
      >
        {loading
          ? "✦ Generating your personalised plan…"
          : `✦ Generate 30-day plan for ${people} ${people === 1 ? "person" : "people"}`}
      </button>
    </div>
  );
}
