export default function Header() {
  return (
    <header className="relative z-10 border-b border-white/5">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ background: "linear-gradient(135deg, #d4a853, #f0c978)", boxShadow: "0 4px 20px rgba(212,168,83,0.35)" }}
          >
            🍽
          </div>
          <div>
            <div className="font-display text-2xl font-bold gold-text tracking-tight leading-none">Dietly</div>
            <div className="text-[10px] text-white/35 uppercase tracking-widest mt-0.5">AI Meal Planner</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2.5 px-4 py-2 glass rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span className="text-xs text-white/40 font-medium">Powered by Claude AI</span>
        </div>
      </div>
    </header>
  );
}
