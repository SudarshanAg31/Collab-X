import { useEffect, useState } from 'react';
import { Outlet, useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import WorkspaceTabs from '../../components/workspace/WorkspaceTabs';
import Spinner from '../../components/common/Spinner';

export default function WorkspaceLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    // Verify access using the workspace endpoint
    api.get(`/projects/${id}/workspace`)
      .then(({ data }) => {
        if (!cancelled) setProject(data.project);
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.code === 'NOT_WORKSPACE_MEMBER') navigate(`/projects/${id}`);
          else setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, navigate]);

  if (loading) return <Spinner full />;
  if (error) return <p className="text-status-danger">{error}</p>;

  return (
    <div className="space-y-4">
      <div>
        <Link to={`/projects/${id}`} className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4">
          <ArrowLeft size={14} /> Back to Project
        </Link>
        <h1 className="text-3xl font-bold">{project?.title} Workspace</h1>
      </div>
      
      <WorkspaceTabs />
      
      {/* This renders the specific tab (Overview, Repository, etc.) */}
      <Outlet context={{ project }} />
    </div>
  );
}
