export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-white/30 transition-colors placeholder:text-gray-500 focus:outline-none ${className}`}
      {...props}
    />
  );
}