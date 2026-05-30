import { useState } from "react";

const PRESETS = [
  { label: "No non-veg on Saturday", icon: "🚫🍗" },
  { label: "No eggs on Tuesday & Saturday", icon: "🥚" },
  { label: "No meat on Tuesday & Saturday", icon: "🥩" },
  { label: "Non-veg mandatory on Sunday", icon: "🍖" },
  { label: "Dairy-free", icon: "🥛" },
  { label: "Gluten-free", icon: "🌾" },
];

const DIET_OPTIONS = [
  { value: "veg", label: "Vegetarian", icon: "🥦", desc: "100% plant-based" },
  { value: "mixed", label: "Mixed", icon: "🍽", desc: "Balanced variety" },
  { value: "nonveg", label: "Non-Veg", icon: "🍗", desc: "Includes meat & fish" },
];

export default function MealPlanForm({ onGenerate, loading, hasPlan }) {
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
    const trimmed = customInput.trim();
    if (trimmed && !restrictions.includes(trimmed)) {
      setRestrictions((prev) => [...prev, trimmed]);
    }
    setCustomInput("");
  };

  const remove = (r) => setRestrictions((prev) => prev.filter((x) => x !== r));

  const handleKey = (e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } };

  const handleSubmit = () => onGenerate({ monthly_budget: budget, preference, people, restrictions });

  return (
    <div className="glass rounded-2xl p-7 fade-up" style={{ borderColor: "rgba(255,255,255,0.08)" }}>

      {/* Section label */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ background: "rgba(212,168,83,0.15)", border: "1px solid rgba(212,168,83,0.25)" }}>
          ✦
        </div>
        <div>
          <h2 className="text-base font-semibold text-white/90">Configure your meal plan</h2>
          <p className="text-xs text-white/35 mt-0.5">Set your preferences and let AI do the rest</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Budget */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Monthly Budget</label>
          <div className="glass rounded-xl p-4" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-bold gold-text">£{budget}</span>
              <span className="text-xs text-white/30">/month</span>
            </div>
            <input
              type="range" min={30} max={500} step={5} value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
            <div className="flex justify-between mt-2">
              <span className="text-[11px] text-white/30">£{(budget / 4).toFixed(0)}/wk</span>
              <span className="text-[11px] text-white/30">£{(budget / people / 30).toFixed(1)}/day per person</span>
            </div>
          </div>
        </div>

        {/* Diet preference */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Diet Preference</label>
          <div className="space-y-2">
            {DIET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPreference(opt.value)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left"
                style={{
                  background: preference === opt.value ? "rgba(212,168,83,0.1)" : "rgba(255,255,255,0.02)",
                  borderColor: preference === opt.value ? "rgba(212,168,83,0.4)" : "rgba(255,255,255,0.07)",
                }}
              >
                <span className="text-base">{opt.icon}</span>
                <div>
                  <div className={`text-sm font-medium ${preference === opt.value ? "text-gold" : "text-white/60"}`}>
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-white/30">{opt.desc}</div>
                </div>
                {preference === opt.value && (
                  <span className="ml-auto text-gold text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* People */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Number of People</label>
          <div className="glass rounded-xl p-4" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-bold text-white/90">{people}</span>
              <span className="text-xs text-white/30">{people === 1 ? "person" : "people"}</span>
            </div>
            <input
              type="range" min={1} max={10} step={1} value={people}
              onChange={(e) => setPeople(Number(e.target.value))}
            />
            <div className="flex justify-between mt-2">
              <span className="text-[11px] text-white/30">Min 1</span>
              <span className="text-[11px] text-white/30">Max 10</span>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-[11px] text-white/35">Budget per person: <span className="text-gold/70">£{(budget / people).toFixed(0)}/month</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Restrictions */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Dietary Restrictions</label>
          {restrictions.length > 0 && (
            <span className="text-[11px] text-gold/60">{restrictions.length} active</span>
          )}
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map(({ label, icon }) => {
            const active = restrictions.includes(label);
            return (
              <button
                key={label}
                onClick={() => togglePreset(label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200"
                style={{
                  background: active ? "rgba(212,168,83,0.12)" : "rgba(255,255,255,0.03)",
                  borderColor: active ? "rgba(212,168,83,0.35)" : "rgba(255,255,255,0.08)",
                  color: active ? "#f0c978" : "rgba(255,255,255,0.4)",
                }}
              >
                <span>{icon}</span>
                {label}
                {active && <span className="text-gold ml-0.5">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Custom input */}
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
            style={{ background: "rgba(212,168,83,0.15)", border: "1px solid rgba(212,168,83,0.3)", color: "#f0c978" }}
          >
            + Add
          </button>
        </div>

        {/* Active chips */}
        {restrictions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {restrictions.map((r) => (
              <span
                key={r}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                style={{ background: "rgba(212,168,83,0.1)", border: "1px solid rgba(212,168,83,0.2)", color: "rgba(240,201,120,0.8)" }}
              >
                {r}
                <button onClick={() => remove(r)} className="text-gold/40 hover:text-red-400 transition-colors ml-0.5 font-bold">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
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
