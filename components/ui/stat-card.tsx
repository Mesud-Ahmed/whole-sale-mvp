export function StatCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="panel">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
    </div>
  );
}
