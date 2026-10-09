export default function Loading({ label = "불러오는 중…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-20 text-muted" role="status">
      <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-transparent" />
      {label}
    </div>
  );
}
