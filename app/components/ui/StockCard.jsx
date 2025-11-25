// app/components/StockCard.jsx
export default function StockCard({ symbol, price, change, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all ${
        selected ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      {/* Content */}
    </button>
  );
}