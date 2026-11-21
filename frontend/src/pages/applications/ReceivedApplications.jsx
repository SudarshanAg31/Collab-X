import { useEffect, useState } from 'react';
import { FolderKanban } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import { statusColor, relativeTime } from '../../utils/format';

export default function ReceivedApplications() {
  const [ownedProjects, setOwnedProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/memberships/my');
        const owned = (data.memberships || []).filter((m) => m.role === 'owner');
        if (!cancelled) {
          setOwnedProjects(owned);
          if (owned.length > 0) setSelected(owned[0].project.id);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    api
      .get(`/projects/${selected}/applications`)
      .then(({ data }) => { if (!cancelled) setApps(data.applications || []); })
      .catch(() => { if (!cancelled) setApps([]); });
    return () => { cancelled = true; };
  }, [selected]);

  async function handleAction(appId, action) {
    setBusyId(appId);
    try {
      await api.post(`/applications/${appId}/${action}`);
      setApps((prev) =>
        prev.map((a) =>
          a.id === appId ? { ...a, status: action === 'approve' ? 'accepted' : 'rejected' } : a
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Spinner full />;

  if (ownedProjects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No owned projects"
        description="Create a project to start receiving applications."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Received Applications</h1>
        <p className="mt-1 text-sm text-text-muted">Review and respond to applicants.</p>
      </div>

      <div>
        <label className="label">Project</label>
        <select
          className="input max-w-md"
          value={selected || ''}
          onChange={(e) => setSelected(e.target.value)}
        >
          {ownedProjects.map((m) => (
            <option key={m.project.id} value={m.project.id}>
              {m.project.title}
            </option>
          ))}
        </select>
      </div>

      {apps.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No applications yet" description="Check back soon." />
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-base font-semibold">
                    {a.applicant?.fullName || a.applicant?.username}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    @{a.applicant?.githubUsername} · {a.applicant?.experienceLevel || 'unknown'} · Applied {relativeTime(a.createdAt)}
                  </p>
                  {a.applicant?.skills?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {a.applicant.skills.slice(0, 6).map((s) => (
                        <span key={s} className="rounded bg-bg-elevated px-2 py-0.5 text-[11px] text-text-muted">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {a.message && <p className="mt-3 text-sm text-text-muted">{a.message}</p>}
                </div>
                <Badge variant={statusColor(a.status)}>{a.status}</Badge>
              </div>

              {a.status === 'pending' && (
                <div className="mt-4 flex justify-end gap-2 border-t border-bg-border pt-4">
                  <Button
                    variant="secondary"
                    disabled={busyId === a.id}
                    onClick={() => handleAction(a.id, 'reject')}
                  >
                    Reject
                  </Button>
                  <Button
                    loading={busyId === a.id}
                    onClick={() => handleAction(a.id, 'approve')}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}