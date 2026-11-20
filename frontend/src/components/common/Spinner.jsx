export default function Spinner({ full = false, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  const spinner = (
    <div
      className={`${sizeClass} animate-spin rounded-full border-2 border-bg-border border-t-accent-violet`}
    />
  );
  if (full) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg-base">
        {spinner}
      </div>
    );
  }
  return spinner;
}