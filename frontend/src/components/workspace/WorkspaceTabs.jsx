import { NavLink, useParams } from 'react-router-dom';

const tabs = [
  { path: '', label: 'Overview', end: true },
  { path: 'repository', label: 'Repository Explorer' },
  { path: 'commits', label: 'Commit History' },
  { path: 'announcements', label: 'Announcements' },
  { path: 'meetings', label: 'Meetings' },
  { path: 'notices', label: 'Notice Board' },
  { path: 'team', label: 'Team Members' },
];

export default function WorkspaceTabs() {
  const { id } = useParams();

  return (
    <div className="border-b border-bg-border mb-6">
      <nav className="flex space-x-1 overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={`/projects/${id}/workspace${tab.path ? `/${tab.path}` : ''}`}
            end={tab.end}
            className={({ isActive }) =>
              `px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-accent-violet text-accent-violet'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-bg-border'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}