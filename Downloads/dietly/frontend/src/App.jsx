import { useState } from "react";
import { useTheme } from "./hooks/useTheme";
import MealPlanForm from "./components/MealPlanForm";
import MealPlanDisplay from "./components/MealPlanDisplay";
import InsightsPanel from "./components/InsightsPanel";
import Header from "./components/Header";

export default function App() {
  const { theme, toggle } = useTheme();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rateLimited, setRateLimited] = useState(false);

  const handleGenerate = async (formData) => {
    setLoading(true);
    setError("");
    setRateLimited(false);
    try {
      const res = await fetch("/api/meals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.status === 429) {
        const data = await res.json();
        setRateLimited(true);
        setError(data.detail);
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPlan({ ...data, formData });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!plan) return;
    const res = await fetch("/api/pdf/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: plan.plan,
        people: plan.formData.people,
        preference: plan.formData.preference,
        monthly_budget: plan.formData.monthly_budget,
        restrictions: plan.formData.restrictions,
      }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dietly_monthly_plan.pdf";
    a.click();
  };

  return (
    <div className="relative min-h-screen">
      <Header theme={theme} onToggleTheme={toggle} />
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {!plan && (
          <div className="text-center mb-12 fade-up">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full mb-5"
              style={{ borderColor: "rgba(212,168,83,0.2)" }}
            >
              <span className="text-xs font-medium tracking-wide uppercase" style={{ color: "rgba(212,168,83,0.85)" }}>
                AI-Powered · 30-Day Plans
              </span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold mb-4 leading-tight">
              <span className="gold-text">Personalised</span><br />
              <span style={{ color: "var(--text)" }}>Indian Meal Plans</span>
            </h1>
            <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: "var(--text-3)" }}>
              AI-curated monthly meal plans tailored to your budget, family size, and dietary needs — using UK supermarket ingredients.
            </p>
            <p className="mt-4 text-xs tracking-widest uppercase" style={{ color: "var(--text-3)" }}>
              crafted by <span className="gold-text font-semibold not-italic">Yash</span>
            </p>
          </div>
        )}

        <MealPlanForm onGenerate={handleGenerate} loading={loading} />

        {error && (
          <div
            className="mt-4 p-5 glass rounded-xl text-sm fade-up"
            style={{
              borderColor: rateLimited ? "rgba(212,168,83,0.3)" : "rgba(239,68,68,0.25)",
              color: rateLimited ? "#f0c978" : "#fca5a5",
            }}
          >
            {rateLimited ? (
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌅</span>
                <div>
                  <p className="font-semibold mb-1" style={{ color: "#f0c978" }}>Daily limit reached</p>
                  <p style={{ color: "var(--text-2)" }}>{error}</p>
                </div>
              </div>
            ) : (
              <>⚠ {error}</>
            )}
          </div>
        )}

        {plan && (
          <div className="fade-up">
            <InsightsPanel
              insights={plan.insights}
              costs={{ weekly: plan.estimated_weekly_cost, monthly: plan.total_monthly_cost }}
              people={plan.formData.people}
              preference={plan.formData.preference}
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2.5 px-5 py-2.5 glass rounded-xl text-sm font-medium transition-all duration-200"
                style={{ borderColor: "rgba(212,168,83,0.3)", color: "rgba(212,168,83,0.85)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,168,83,0.1)"; e.currentTarget.style.borderColor = "rgba(212,168,83,0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "rgba(212,168,83,0.3)"; }}
              >
                ↓ Download PDF
              </button>
            </div>
            <MealPlanDisplay plan={plan.plan} />
          </div>
        )}
      </main>
    </div>
  );
}
