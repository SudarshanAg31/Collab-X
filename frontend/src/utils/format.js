export function relativeTime(isoDate) {
  if (!isoDate) return '';
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = now - then;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return then.toLocaleDateString();
}

export function formatDate(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function statusColor(status) {
  switch (status) {
    case 'open':
    case 'accepted':
    case 'sent':
    case 'active':
      return 'success';
    case 'in_progress':
    case 'pending':
    case 'retrying':
      return 'warning';
    case 'rejected':
    case 'failed':
    case 'archived':
      return 'danger';
    case 'completed':
      return 'info';
    default:
      return 'default';
  }
}