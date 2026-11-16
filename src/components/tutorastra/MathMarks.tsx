const MARKS = [
  { symbol: 'π', className: 'left-[6%] top-[14%] text-8xl' },
  { symbol: 'θ', className: 'right-[8%] top-[28%] text-7xl' },
  { symbol: '∑', className: 'left-[12%] top-[58%] text-6xl' },
  { symbol: '∫', className: 'right-[14%] top-[62%] text-8xl' },
  { symbol: '√', className: 'right-[22%] top-[12%] text-6xl' },
  { symbol: 'Δ', className: 'left-[4%] bottom-[12%] text-7xl' },
];

export default function MathMarks() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {MARKS.map((mark) => (
        <span key={mark.symbol} className={`ta-math-mark absolute font-display font-semibold text-[#310064] ${mark.className}`}>
          {mark.symbol}
        </span>
      ))}
    </div>
  );
}
