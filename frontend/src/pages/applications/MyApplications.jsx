import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import { statusColor, relativeTime } from '../../utils/format';

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/applications/my')
      .then(({ data }) => { if (!cancelled) setApps(data.applications || []); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Spinner full />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="mt-1 text-sm text-text-muted">Track where you've applied.</p>
      </div>

      {apps.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Browse projects and apply to start building."
          action={<Link to="/discover" className="btn-primary">Discover Projects</Link>}
        />
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <Link
                  to={`/projects/${a.project?.id}`}
                  className="text-base font-semibold hover:text-accent-violet"
                >
                  {a.project?.title || 'Unknown project'}
                </Link>
                <p className="mt-1 text-xs text-text-muted">
                  Role: {a.requestedRole} · Applied {relativeTime(a.createdAt)}
                </p>
              </div>
              <Badge variant={statusColor(a.status)}>{a.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}