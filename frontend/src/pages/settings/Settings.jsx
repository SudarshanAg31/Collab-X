import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { GitBranch, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Settings() {
  const { user, logout } = useAuth();
  const [githubStatus, setGithubStatus] = useState(null);
  const [loadingGithub, setLoadingGithub] = useState(true);

  useEffect(() => {
    // Fetch GitHub connection status
    api.get('/auth/github/status')
      .then(({ data }) => setGithubStatus(data))
      .catch(() => setGithubStatus({ connected: false }))
      .finally(() => setLoadingGithub(false));
  }, []);

  const handleConnectGithub = async () => {
    try {
      const { data } = await api.get('/auth/github/url');
      window.location.href = data.url;
    } catch (err) {
      alert("Failed to start GitHub OAuth: " + err.message);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">Manage your account preferences and connections.</p>
      </div>

      {/* Account Settings */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 border-b border-bg-border pb-2">Account Details</h2>
        <div className="space-y-4">
          <Input label="Username" value={user?.username || ''} disabled />
          <Input label="Email Address" value={user?.email || ''} disabled />
          <p className="text-xs text-text-subtle mt-2">
            * To change your username or email, please contact support.
          </p>
        </div>
      </div>

      {/* GitHub Integration */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 border-b border-bg-border pb-2">GitHub Integration</h2>
        
        {loadingGithub ? (
          <p className="text-sm text-text-muted">Checking GitHub connection...</p>
        ) : githubStatus?.connected ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-status-success/10 border border-status-success/20 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-status-success" size={24} />
              <div>
                <p className="font-semibold text-status-success">Connected to GitHub</p>
                <p className="text-sm text-text-muted">Logged in as <strong>@{githubStatus.githubLogin}</strong></p>
                <p className="text-xs text-text-subtle mt-1">Scopes: {githubStatus.scopes?.join(', ') || 'repo'}</p>
              </div>
            </div>
            <Button variant="secondary" onClick={handleConnectGithub}>
              Reconnect
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-bg-elevated border border-bg-border rounded-lg">
            <div className="flex items-center gap-3">
              <GitBranch className="text-text-muted" size={24} />
              <div>
                <p className="font-semibold text-text-primary">GitHub Not Connected</p>
                <p className="text-sm text-text-muted">Connect your account to enable repository explorer and invitations.</p>
              </div>
            </div>
            <Button variant="primary" onClick={handleConnectGithub}>
              Connect GitHub
            </Button>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-status-danger/20">
        <h2 className="text-lg font-semibold mb-4 border-b border-bg-border pb-2 text-status-danger flex items-center gap-2">
          <ShieldAlert size={18} /> Danger Zone
        </h2>
        <p className="text-sm text-text-muted mb-4">
          Once you log out, you will need to sign in again to access your account.
        </p>
        <Button variant="secondary" onClick={logout} className="text-status-danger border-status-danger/30 hover:bg-status-danger/10">
          Sign Out of CollabX
        </Button>
      </div>

    </div>
  );
}