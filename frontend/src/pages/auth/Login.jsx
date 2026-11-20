import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const githubStatus = params.get('github');

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form);
      navigate(user.isProfileComplete ? '/' : '/complete-profile', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-8">
      <h2 className="mb-1 text-xl font-bold">Welcome back</h2>
      <p className="mb-6 text-sm text-text-muted">Sign in to continue to CollabX.</p>

      {githubStatus === 'connected' && (
        <div className="mb-4 rounded-lg border border-status-success/40 bg-status-success/10 px-3 py-2 text-sm text-status-success">
          GitHub connected successfully.
        </div>
      )}
      {githubStatus === 'error' && (
        <div className="mb-4 rounded-lg border border-status-danger/40 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
          GitHub connection failed. Try again.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-status-danger/40 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email or Username"
          value={form.identifier}
          onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          required
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        New to CollabX?{' '}
        <Link to="/register" className="text-accent-violet hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}