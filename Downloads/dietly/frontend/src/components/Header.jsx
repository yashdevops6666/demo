export default function Header() {
  return (
    <header className="bg-green-800 text-white shadow">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥗</span>
          <span className="text-xl font-bold tracking-tight">Dietly</span>
          <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full ml-1">AI powered</span>
        </div>
        <p className="text-sm text-green-200 hidden md:block">
          Personalised Indian meal plans · UK ingredients · Powered by Claude AI
        </p>
      </div>
    </header>
  );
}
