const colors = {
  success: 'bg-status-success/15 text-status-success border-status-success/30',
  warning: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  danger: 'bg-status-danger/15 text-status-danger border-status-danger/30',
  info: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
  violet: 'bg-accent-violet/15 text-accent-violet border-accent-violet/30',
  default: 'bg-bg-elevated text-text-muted border-bg-border',
};

export default function Badge({ children, variant = 'default' }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${colors[variant] || colors.default}`}
    >
      {children}
    </span>
  );
}