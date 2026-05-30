export default function Header({ theme, onToggleTheme }) {
  const isDark = theme === "dark";

  return (
    <header className="relative z-10" style={{ borderBottom: "1px solid var(--border)" }}>
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "var(--header-overlay)" }}
      />
      <div className="relative max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #d4a853, #f0c978)",
              boxShadow: "0 4px 20px rgba(212,168,83,0.35)",
            }}
          >
            🍽
          </div>
          <div>
            <div className="font-display text-2xl font-bold gold-text tracking-tight leading-none">
              Dietly
            </div>
            <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--text-3)" }}>
              AI Meal Planner
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2.5 px-4 py-2 glass rounded-full">
            <span
              className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
              style={{ background: "#4ade80" }}
            />
            <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
              Powered by Claude AI
            </span>
          </div>

          {/* Theme toggle */}
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? "☀" : "◑"}
          </button>
        </div>
      </div>
    </header>
  );
}
