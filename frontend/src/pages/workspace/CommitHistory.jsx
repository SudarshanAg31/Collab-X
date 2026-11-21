import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { GitCommit, RefreshCw, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import { relativeTime } from '../../utils/format';

export default function CommitHistory() {
  const { project } = useOutletContext();
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCommits();
  }, [project.id]);

  async function loadCommits() {
    setLoading(true);
    try {
      const { data } = await api.get(`/projects/${project.id}/github/commits?limit=30`);
      setCommits(data.commits || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="py-12 flex justify-center"><Spinner /></div>;
  if (error) return <p className="text-status-danger">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Commits</h2>
        <button onClick={loadCommits} className="btn-ghost text-xs">
          <RefreshCw size={14} className="mr-2" /> Refresh
        </button>
      </div>

      <div className="card border border-bg-border rounded-xl overflow-hidden">
        {commits.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No commits found.</div>
        ) : (
          <div className="divide-y divide-bg-border">
            {commits.map((c) => (
              <div key={c.sha} className="p-4 flex items-start gap-4 hover:bg-bg-elevated/50 transition-colors">
                <div className="mt-1 bg-bg-elevated p-2 rounded-full text-text-muted">
                  <GitCommit size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.message}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {c.authorName} {c.authorLogin && `(@${c.authorLogin})`} committed {relativeTime(c.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-text-subtle bg-bg-elevated px-2 py-1 rounded">
                    {c.shortSha}
                  </span>
                  <a href={c.htmlUrl} target="_blank" rel="noreferrer" className="text-text-muted hover:text-accent-violet">
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}