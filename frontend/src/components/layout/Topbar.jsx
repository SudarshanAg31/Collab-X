import { Bell, Plus, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex h-16 items-center gap-4 border-b border-bg-border bg-bg-surface px-6">
      <div className="relative flex-1 max-w-xl">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
        />
        <input
          type="text"
          placeholder="Search projects, commits, teammates..."
          className="input pl-9"
          onKeyDown={(e) => {
            if (e.key === 'Enter') navigate(`/discover?q=${encodeURIComponent(e.target.value)}`);
          }}
        />
      </div>

      <button className="btn-ghost" aria-label="Notifications">
        <Bell size={18} />
      </button>

      <Button variant="primary" onClick={() => navigate('/projects/new')}>
        <Plus size={16} /> Create Project
      </Button>

      <div className="relative group">
        <button className="flex items-center gap-2 rounded-full bg-bg-elevated px-3 py-1.5 text-sm hover:bg-bg-border">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-violet text-xs font-bold text-white">
            {user?.username?.[0]?.toUpperCase() || '?'}
          </span>
          <span className="hidden md:inline">{user?.username}</span>
        </button>
        <div className="absolute right-0 top-full mt-2 hidden w-48 rounded-lg border border-bg-border bg-bg-surface shadow-lg group-hover:block">
          <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-bg-elevated">
            Profile
          </Link>
          <button
            onClick={logout}
            className="block w-full px-4 py-2 text-left text-sm text-status-danger hover:bg-bg-elevated"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}