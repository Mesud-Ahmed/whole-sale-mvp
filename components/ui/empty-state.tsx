export function EmptyState({
  title,
  action
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel flex min-h-36 flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-semibold text-muted">{title}</p>
      {action}
    </div>
  );
}
