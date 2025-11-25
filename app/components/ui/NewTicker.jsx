// app/components/NewsTicker.jsx
export default function NewsTicker({ news }) {
  return (
    <div className="overflow-hidden bg-gradient-to-r from-red-900/20 via-orange-900/20 to-red-900/20">
      <div className="animate-marquee whitespace-nowrap py-3">
        <span>{news}</span>
      </div>
    </div>
  );
}