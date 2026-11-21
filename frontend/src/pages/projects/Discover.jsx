import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import api from '../../services/api';
import ProjectCard from '../../components/projects/ProjectCard';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';

const CATEGORIES = ['web', 'mobile', 'ai_ml', 'devops', 'blockchain', 'game', 'other'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function Discover() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', category: '', experienceLevel: '' });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.category) params.set('category', filters.category);
    if (filters.experienceLevel) params.set('experienceLevel', filters.experienceLevel);

    api
      .get(`/projects${params.toString() ? `?${params}` : ''}`)
      .then(({ data }) => {
        if (!cancelled) setProjects(data.projects || []);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Discover Projects</h1>
        <p className="mt-1 text-sm text-text-muted">
          Find high-impact teams building real software.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <input
          type="text"
          placeholder="Search by title…"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          className="input"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            className="input"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="input"
            value={filters.experienceLevel}
            onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
          >
            <option value="">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No projects found"
          description="Try different filters, or create your own project."
          action={<Link to="/projects/new" className="btn-primary">Create Project</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}