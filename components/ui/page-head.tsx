export function PageHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
    </div>
  );
}
