import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, FileText, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/dashboard/StatCard';
import ProjectCard from '../../components/projects/ProjectCard';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    memberships: [],
    applications: [],
    matches: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, a, match] = await Promise.all([
          api.get('/memberships/my').catch(() => ({ data: { memberships: [] } })),
          api.get('/applications/my').catch(() => ({ data: { applications: [] } })),
          api.get('/projects/match/me').catch(() => ({ data: { matches: [] } })),
        ]);
        if (!cancelled) {
          setData({
            memberships: m.data.memberships || [],
            applications: a.data.applications || [],
            matches: match.data.matches || [],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner full />;

  const pending = data.applications.filter((a) => a.status === 'pending').length;
  const activeWorkspaces = data.memberships.filter((m) => m.project?.status !== 'archived');
  const recommended = data.matches.slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.profile?.fullName || user?.username}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {user?.profile?.experienceLevel && `${user.profile.experienceLevel} · `}
          @{user?.githubUsername}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Workspaces" value={activeWorkspaces.length} icon={FolderKanban} />
        <StatCard label="Applications" value={data.applications.length} hint={`${pending} pending`} icon={FileText} />
        <StatCard label="Recommended" value={data.matches.length} icon={Sparkles} />
        <StatCard label="Profile" value={user?.isProfileComplete ? '100%' : 'Incomplete'} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Workspaces</h2>
            <Link to="/my-applications" className="text-xs text-text-muted hover:text-accent-violet">
              View all
            </Link>
          </div>

          {activeWorkspaces.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No active workspaces yet"
              description="Apply to a project to get started."
              action={
                <Link to="/discover" className="btn-primary">
                  Discover Projects
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {activeWorkspaces.slice(0, 3).map((m) => (
                <Link
                  key={m.id}
                  to={`/projects/${m.project.id}/workspace`}
                  className="card block p-5 transition-colors hover:border-accent-violet/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{m.project.title}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {m.role === 'owner' ? 'Owner' : 'Member'} · {m.project.status}
                      </p>
                    </div>
                    <span className="text-xs text-accent-violet">Open →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recommended</h2>
            <Link to="/discover" className="text-xs text-text-muted hover:text-accent-violet">
              Browse
            </Link>
          </div>
          {recommended.length === 0 ? (
            <EmptyState icon={Sparkles} title="No matches yet" description="Complete more of your profile." />
          ) : (
            <div className="space-y-3">
              {recommended.map((match) => (
                <ProjectCard
                  key={match.project.id}
                  project={match.project}
                  matchScore={match.score}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}