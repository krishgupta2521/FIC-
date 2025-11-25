export function LiveBadge() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
      <span className="text-sm">Live Trading</span>
    </div>
  );
}

export function StatusBadge({ children, variant = "default" }) {
  const variants = {
    danger: "bg-red-500/20 text-red-400",
    success: "bg-green-500/20 text-green-400",
    warning: "bg-yellow-500/20 text-yellow-400",
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${variants[variant] || "bg-white/10 text-gray-400"}`}>
      {children}
    </span>
  );
}