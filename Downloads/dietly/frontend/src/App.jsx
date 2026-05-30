import { useState } from "react";
import MealPlanForm from "./components/MealPlanForm";
import MealPlanDisplay from "./components/MealPlanDisplay";
import InsightsPanel from "./components/InsightsPanel";
import Header from "./components/Header";

export default function App() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (formData) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/meals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
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
      <Header />
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {!plan && (
          <div className="text-center mb-12 fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full mb-5 border border-gold/20">
              <span className="text-xs text-gold/80 font-medium tracking-wide uppercase">AI-Powered · 30-Day Plans</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold mb-4 leading-tight">
              <span className="gold-text">Personalised</span><br />
              <span className="text-white/90">Indian Meal Plans</span>
            </h1>
            <p className="text-white/40 text-base max-w-md mx-auto leading-relaxed">
              AI-curated monthly meal plans tailored to your budget, family size, and dietary needs — using UK supermarket ingredients.
            </p>
          </div>
        )}

        <MealPlanForm onGenerate={handleGenerate} loading={loading} hasPlan={!!plan} />

        {error && (
          <div className="mt-4 p-4 glass border border-red-500/20 rounded-xl text-red-300 text-sm fade-up">
            ⚠ {error}
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
                className="flex items-center gap-2.5 px-5 py-2.5 glass border border-gold/30 text-gold/90 rounded-xl text-sm font-medium hover:bg-gold/10 hover:border-gold/50 transition-all duration-200"
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
