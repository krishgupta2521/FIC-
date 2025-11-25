export function GlassCard({ children, className = "" }) {
  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all ${className}`}>
      {children}
    </div>
  );
}

export function SolidCard({ children, className = "" }) {
  return (
    <div className={`bg-[#111] rounded-2xl p-6 border border-white/10 ${className}`}>
      {children}
    </div>
  );
}

export function GradientCard({ children, className = "" }) {
  return (
    <div className={`bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-8 border border-white/10 ${className}`}>
      {children}
    </div>
  );
}