export function PrimaryButton({ children, onClick, className = "", ...props }) {
  return (
    <button
      onClick={onClick}
      className={`px-10 py-5 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, className = "", ...props }) {
  return (
    <button
      onClick={onClick}
      className={`px-10 py-5 border border-white/20 rounded-xl font-semibold hover:bg-white/5 transition-all ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BuyButton({ children = "Buy Now", ...props }) {
  return (
    <button className="w-full py-4 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg transition" {...props}>
      {children}
    </button>
  );
}

export function SellButton({ children = "Sell Now", ...props }) {
  return (
    <button className="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg transition" {...props}>
      {children}
    </button>
  );
}