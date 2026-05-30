import { useState } from "react";

const MEALS = [
  { key: "breakfast", label: "Breakfast", icon: "☀" },
  { key: "lunch", label: "Lunch", icon: "🍱" },
  { key: "snack", label: "Snack", icon: "🍎" },
  { key: "dinner", label: "Dinner", icon: "🌙" },
];

const TYPE_STYLE = {
  veg: { dot: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)", badge: "rgba(74,222,128,0.15)", badgeText: "#4ade80", label: "Veg" },
  nonveg: { dot: "#fb923c", bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.18)", badge: "rgba(251,146,60,0.15)", badgeText: "#fb923c", label: "Non-Veg" },
  sunday_special: { dot: "#fbbf24", bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.22)", badge: "rgba(251,191,36,0.15)", badgeText: "#fbbf24", label: "Special" },
};

function DayCard({ day }) {
  const [expanded, setExpanded] = useState(false);
  const s = TYPE_STYLE[day.type] || TYPE_STYLE.veg;

  return (
    <div
      className="day-card cursor-pointer select-none"
      style={{ background: expanded ? s.bg : "rgba(255,255,255,0.025)", borderColor: expanded ? s.border : "rgba(255,255,255,0.06)" }}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot, boxShadow: `0 0 8px ${s.dot}` }} />
          <span className="text-sm font-semibold text-white/85">{day.day}</span>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: s.badge, color: s.badgeText }}
          >
            {s.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white/40">£{day.estimated_cost?.toFixed(2)}</span>
          <span className="text-white/20 text-xs transition-transform duration-200" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MEALS.map(({ key, label, icon }) =>
            day[key] ? (
              <div key={key} className="flex gap-2.5 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-0.5">{label}</p>
                  <p className="text-xs text-white/65 leading-relaxed">{day[key]}</p>
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

export default function MealPlanDisplay({ plan }) {
  const [activeWeek, setActiveWeek] = useState(0);
  const weeks = ["week1", "week2", "week3", "week4"];
  const days = plan?.[weeks[activeWeek]] || [];

  const weekStats = weeks.map((wk) => {
    const d = plan?.[wk] || [];
    const total = d.reduce((s, day) => s + (day.estimated_cost || 0), 0);
    return { total, count: d.length };
  });

  return (
    <div className="mt-8 fade-up">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-2xl font-bold text-white/90">Your 30-Day Plan</h2>
        <p className="text-xs text-white/30">Click any day to expand meals</p>
      </div>

      {/* Week tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {weeks.map((wk, i) => (
          <button
            key={wk}
            onClick={() => setActiveWeek(i)}
            className={`week-tab flex-shrink-0 ${activeWeek === i ? "active" : ""}`}
          >
            <div className="font-medium">Week {i + 1}</div>
            <div className="text-[10px] opacity-60 mt-0.5">£{weekStats[i].total.toFixed(0)} total</div>
          </button>
        ))}
      </div>

      {/* Day cards */}
      <div className="space-y-2">
        {days.map((day, i) => (
          <DayCard key={i} day={day} />
        ))}
        {days.length === 0 && (
          <p className="text-center text-white/20 py-12 text-sm">No data for this week.</p>
        )}
      </div>
    </div>
  );
}
