// Shown instantly on navigation while the next page's data loads,
// so a click reacts immediately instead of feeling frozen.
export default function Loading() {
  return (
    <div className="page section active">
      <div className="page-head">
        <div>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-sub" />
        </div>
      </div>
      <div className="grid grid-stats" style={{ marginBottom: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="kpi" key={i}>
            <div className="skeleton skeleton-line" style={{ width: "55%" }} />
            <div className="skeleton skeleton-line" style={{ width: "40%", height: 26, margin: "10px 0 6px" }} />
            <div className="skeleton skeleton-line" style={{ width: "70%" }} />
          </div>
        ))}
      </div>
      <div className="card">
        <div className="skeleton skeleton-line" style={{ width: "30%", marginBottom: 16 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="skeleton skeleton-line" key={i} style={{ width: `${90 - i * 10}%`, marginBottom: 12 }} />
        ))}
      </div>
    </div>
  );
}
