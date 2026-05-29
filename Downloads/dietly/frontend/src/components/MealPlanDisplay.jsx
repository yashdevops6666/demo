// MealPlanDisplay.jsx
export function MealPlanDisplay({ plan }) {
  const weeks = ["week1","week2","week3","week4"];
  const dayColor = {
    veg: "border-l-green-500 bg-green-50",
    nonveg: "border-l-orange-400 bg-orange-50",
    sunday_special: "border-l-amber-500 bg-amber-50",
  };
  const badge = {
    veg: "bg-green-100 text-green-800",
    nonveg: "bg-orange-100 text-orange-800",
    sunday_special: "bg-amber-100 text-amber-800",
  };

  return (
    <div className="mt-6 space-y-8">
      {weeks.map((wk, wi) => {
        const days = plan?.[wk] || [];
        return (
          <div key={wk}>
            <h3 className="text-base font-semibold text-green-900 mb-3">Week {wi + 1}</h3>
            <div className="space-y-3">
              {days.map((day, di) => (
                <div key={di} className={`rounded-xl border-l-4 p-4 ${dayColor[day.type] || dayColor.veg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-gray-800">{day.day}</span>
                    <div className="flex gap-2 items-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge[day.type] || badge.veg}`}>
                        {day.type === "sunday_special" ? "Sunday Special" : day.type === "veg" ? "Veg" : "Non-veg"}
                      </span>
                      <span className="text-xs text-gray-500">£{day.estimated_cost?.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                    {[["🌅","breakfast"],["☀️","lunch"],["🍎","snack"],["🌙","dinner"]].map(([icon,k]) => (
                      day[k] && (
                        <div key={k} className="flex gap-1">
                          <span>{icon}</span>
                          <span><strong className="capitalize">{k}:</strong> {day[k]}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MealPlanDisplay;
