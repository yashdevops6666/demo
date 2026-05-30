import { useState } from "react";

const MEALS = [
  { key: "breakfast", label: "Breakfast", icon: "☀" },
  { key: "lunch",     label: "Lunch",     icon: "🍱" },
  { key: "snack",     label: "Snack",     icon: "🍎" },
  { key: "dinner",    label: "Dinner",    icon: "🌙" },
];

const TYPE = {
  veg:            { dot: "#4ade80", badge: "rgba(74,222,128,0.15)",  badgeText: "#4ade80",  activeBg: "rgba(74,222,128,0.06)",  activeBorder: "rgba(74,222,128,0.2)",  label: "Veg" },
  nonveg:         { dot: "#fb923c", badge: "rgba(251,146,60,0.15)",  badgeText: "#fb923c",  activeBg: "rgba(251,146,60,0.06)",  activeBorder: "rgba(251,146,60,0.18)", label: "Non-Veg" },
  sunday_special: { dot: "#fbbf24", badge: "rgba(251,191,36,0.15)",  badgeText: "#fbbf24",  activeBg: "rgba(251,191,36,0.06)",  activeBorder: "rgba(251,191,36,0.22)", label: "Special" },
};

function DayCard({ day }) {
  const [open, setOpen] = useState(false);
  const s = TYPE[day.type] || TYPE.veg;

  return (
    <div
      className="day-card"
      style={{
        background: open ? s.activeBg : "var(--card-bg)",
        borderColor: open ? s.activeBorder : "var(--border)",
      }}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: s.dot, boxShadow: `0 0 8px ${s.dot}` }}
          />
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{day.day}</span>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: s.badge, color: s.badgeText }}
          >
            {s.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
            £{day.estimated_cost?.toFixed(2)}
          </span>
          <span
            className="text-xs transition-transform duration-200"
            style={{ color: "var(--text-3)", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▾
          </span>
        </div>
      </div>

      {open && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MEALS.map(({ key, label, icon }) =>
            day[key] ? (
              <div
                key={key}
                className="flex gap-2.5 p-3 rounded-xl"
                style={{ background: "var(--inner-surface)", border: "1px solid var(--border)" }}
              >
                <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "var(--text-3)" }}>
                    {label}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                    {day[key]}
                  </p>
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

  const weekTotals = weeks.map((wk) =>
    (plan?.[wk] || []).reduce((s, d) => s + (d.estimated_cost || 0), 0)
  );

  return (
    <div className="mt-8 fade-up">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-2xl font-bold" style={{ color: "var(--text)" }}>
          Your 30-Day Plan
        </h2>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>Click any day to expand</p>
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
            <div className="text-[10px] opacity-60 mt-0.5">£{weekTotals[i].toFixed(0)} total</div>
          </button>
        ))}
      </div>

      {/* Day cards */}
      <div className="space-y-2">
        {days.map((day, i) => <DayCard key={i} day={day} />)}
        {days.length === 0 && (
          <p className="text-center py-12 text-sm" style={{ color: "var(--text-3)" }}>
            No data for this week.
          </p>
        )}
      </div>
    </div>
  );
}
