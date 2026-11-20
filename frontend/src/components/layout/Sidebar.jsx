import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  FolderKanban,
  FileText,
  User,
  Settings,
  GitBranch,       // ← generic git icon (Lucide-safe)
} from 'lucide-react';

const navSections = [
  {
    label: 'General',
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/discover', label: 'Discover Projects', icon: Compass },
      { to: '/my-applications', label: 'My Applications', icon: FileText },
      { to: '/applications/received', label: 'Received Applications', icon: FolderKanban },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-bg-border bg-bg-surface">
      <div className="flex h-16 items-center border-b border-bg-border px-5">
        <span className="text-xl font-extrabold tracking-tight">
          <span className="text-accent-violet">Collab</span>X
        </span>
      </div>

      <nav className="flex flex-col gap-6 p-3">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-text-subtle">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-accent-violet/15 text-accent-violet'
                            : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary'
                        }`
                      }
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto p-3 border-t border-bg-border">
        <a
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-text-subtle hover:bg-bg-elevated hover:text-text-primary"
        >
          <GitBranch size={14} /> GitHub Sync
        </a>
      </div>
    </aside>
  );
}