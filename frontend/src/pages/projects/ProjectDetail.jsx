import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, GitBranch, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { statusColor, relativeTime } from '../../utils/format';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [role, setRole] = useState('member');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/projects/${id}`);
        if (!cancelled) {
          setProject(data.project);
          setTeam(data.team || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function handleApply() {
    setApplying(true);
    try {
      await api.post('/applications', { projectId: id, requestedRole: role, message });
      navigate('/my-applications');
    } catch (err) {
      alert(err.message);
    } finally {
      setApplying(false);
    }
  }

  async function handleDeleteProject() {
    if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${id}`);
      navigate('/'); // Redirect to dashboard
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  }

  if (loading) return <Spinner full />;
  if (error) return <p className="text-status-danger">{error}</p>;
  if (!project) return null;

  const isOwner = user?.id === project.owner;
  const isMember = team.some((m) => m.user?.id === user?.id);

  return (
    <div className="space-y-6">
      <Link to="/discover" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary">
        <ArrowLeft size={14} /> Back to Discover
      </Link>

      <div className="card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <Badge variant={statusColor(project.status)}>{project.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {project.category} · {project.experienceLevel} · Updated {relativeTime(project.updatedAt)}
            </p>
          </div>
          <div className="flex gap-2">
            {project.githubRepoUrl && (
              <a
                href={project.githubRepoUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                <GitBranch size={16} /> Repo
              </a>
            )}
            {isOwner && (
              <>
                <Link to={`/projects/${id}/workspace`} className="btn-primary">
                  Open Workspace
                </Link>
                <button 
                  onClick={handleDeleteProject} 
                  disabled={deleting}
                  className="btn-secondary border-status-danger/30 text-status-danger hover:bg-status-danger/10"
                  title="Delete Project"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-6 text-sm text-text-muted">{project.description}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {(project.techStack || []).map((t) => (
            <span key={t} className="rounded-md border border-bg-border bg-bg-elevated px-2 py-0.5 text-xs">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card p-6">
          <h2 className="mb-4 text-lg font-semibold">Team ({team.length})</h2>
          <div className="space-y-3">
            {team.map((m) => (
              <div key={m.membershipId} className="flex items-center justify-between border-b border-bg-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{m.user?.fullName || m.user?.username}</p>
                  <p className="text-xs text-text-muted">@{m.user?.githubUsername} · {m.role}</p>
                </div>
                <Badge variant={m.role === 'owner' ? 'violet' : 'default'}>{m.role}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">Apply to Join</h2>
          {isMember || isOwner ? (
            <p className="text-sm text-text-muted">You're already part of this team.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="label">Requested Role</label>
                <input
                  className="input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. backend"
                />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea
                  className="input"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Why you're a good fit…"
                />
              </div>
              <Button onClick={handleApply} loading={applying} className="w-full">
                Submit Application
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}