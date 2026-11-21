import { Link } from 'react-router-dom';
import Badge from '../common/Badge';
import { statusColor } from '../../utils/format';

export default function ProjectCard({ project, matchScore, onApply }) {
  const owner = project.owner?.fullName || project.owner?.username || 'Unknown';

  return (
    <div className="card flex flex-col p-5 transition-colors hover:border-bg-border/80">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/projects/${project.id}`}
            className="block truncate text-base font-semibold hover:text-accent-violet"
          >
            {project.title}
          </Link>
          <p className="mt-0.5 truncate text-xs text-text-muted">
            by {owner} · @{project.owner?.githubUsername || 'unknown'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={statusColor(project.status)}>{project.status}</Badge>
          {typeof matchScore === 'number' && (
            <span className="text-[10px] font-semibold text-accent-violet">
              {Math.round(matchScore * 100)}% match
            </span>
          )}
        </div>
      </div>

      <p className="mb-4 line-clamp-2 text-sm text-text-muted">{project.summary || project.description}</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(project.techStack || []).slice(0, 5).map((tech) => (
          <span
            key={tech}
            className="rounded-md border border-bg-border bg-bg-elevated px-2 py-0.5 text-[11px] font-medium text-text-muted"
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-bg-border pt-4">
        <div className="text-xs text-text-muted">
          {project.requiredMembers} required · {project.experienceLevel}
        </div>
        <div className="flex gap-2">
          <Link to={`/projects/${project.id}`} className="btn-ghost text-xs">
            View
          </Link>
          {onApply && (
            <button onClick={() => onApply(project)} className="btn-primary text-xs px-3 py-1.5">
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}