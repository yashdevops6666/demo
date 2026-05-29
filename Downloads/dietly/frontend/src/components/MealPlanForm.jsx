import { useState } from "react";

const RESTRICTION_PRESETS = [
  "No non-veg on Saturday",
  "No eggs on Tuesday and Saturday",
  "No meat on Tuesday and Saturday",
  "Non-veg mandatory on Sunday",
  "Dairy-free",
  "Gluten-free",
];

export default function MealPlanForm({ onGenerate, loading }) {
  const [budget, setBudget] = useState(80);
  const [preference, setPreference] = useState("mixed");
  const [people, setPeople] = useState(1);
  const [restrictions, setRestrictions] = useState([]);
  const [customInput, setCustomInput] = useState("");

  const toggleRestriction = (r) =>
    setRestrictions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );

  const addCustomRestriction = () => {
    const trimmed = customInput.trim();
    if (trimmed && !restrictions.includes(trimmed)) {
      setRestrictions((prev) => [...prev, trimmed]);
    }
    setCustomInput("");
  };

  const removeRestriction = (r) =>
    setRestrictions((prev) => prev.filter((x) => x !== r));

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomRestriction();
    }
  };

  const handleSubmit = () =>
    onGenerate({ monthly_budget: budget, preference, people, restrictions });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-green-900 mb-6">
        🥗 Build your monthly meal plan
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Monthly budget (GBP)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range" min={30} max={500} step={5} value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-lg font-semibold text-green-800 min-w-[3rem]">
              £{budget}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            ~£{(budget / 4).toFixed(0)}/week · £{(budget / 30).toFixed(1)}/day per person
          </p>
        </div>

        {/* Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Diet preference
          </label>
          <div className="flex gap-2">
            {["veg", "mixed", "nonveg"].map((p) => (
              <button
                key={p}
                onClick={() => setPreference(p)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                  preference === p
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                }`}
              >
                {p === "veg" ? "🥦 Veg" : p === "nonveg" ? "🍗 Non-veg" : "🍽 Mixed"}
              </button>
            ))}
          </div>
        </div>

        {/* People */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Number of people <span className="text-green-700 font-semibold">({people})</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range" min={1} max={10} step={1} value={people}
              onChange={(e) => setPeople(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-lg font-semibold text-green-800 min-w-[2rem] text-center">
              {people}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Budget per person: £{(budget / people).toFixed(0)}/month
          </p>
        </div>
      </div>

      {/* Restrictions */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Dietary restrictions
          <span className="text-xs text-gray-400 font-normal ml-2">— click to toggle presets or type your own</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {RESTRICTION_PRESETS.map((r) => (
            <button
              key={r}
              onClick={() => toggleRestriction(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                restrictions.includes(r)
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-white text-gray-500 border-gray-200 hover:border-amber-200"
              }`}
            >
              {restrictions.includes(r) ? "✓ " : ""}{r}
            </button>
          ))}
        </div>

        {/* Custom restriction input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. No seafood on Friday, Nut-free, No pork ever…"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200"
          />
          <button
            onClick={addCustomRestriction}
            disabled={!customInput.trim()}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-40 transition"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Active restrictions list */}
      {restrictions.length > 0 && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs font-medium text-amber-700 mb-2">Active restrictions ({restrictions.length}):</p>
          <div className="flex flex-wrap gap-2">
            {restrictions.map((r) => (
              <span
                key={r}
                className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full border border-amber-200"
              >
                {r}
                <button
                  onClick={() => removeRestriction(r)}
                  className="ml-1 text-amber-500 hover:text-red-500 font-bold leading-none"
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-green-700 text-white rounded-xl font-semibold text-base hover:bg-green-800 disabled:opacity-60 transition"
      >
        {loading
          ? "✨ Generating your plan with AI…"
          : `✨ Generate 30-day plan for ${people} ${people === 1 ? "person" : "people"}`}
      </button>
    </div>
  );
}
