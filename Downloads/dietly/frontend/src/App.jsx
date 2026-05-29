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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <MealPlanForm onGenerate={handleGenerate} loading={loading} />
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {plan && (
          <>
            <InsightsPanel insights={plan.insights} costs={{
              weekly: plan.estimated_weekly_cost,
              monthly: plan.total_monthly_cost,
            }} />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition"
              >
                ⬇ Download PDF — Full Month Plan
              </button>
            </div>
            <MealPlanDisplay plan={plan.plan} />
          </>
        )}
      </main>
    </div>
  );
}
