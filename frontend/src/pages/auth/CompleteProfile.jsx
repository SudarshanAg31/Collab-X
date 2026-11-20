import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];
const CATEGORIES = ['web', 'mobile', 'ai_ml', 'devops', 'blockchain', 'game', 'other'];

export default function CompleteProfile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.profile?.fullName || '',
    bio: user?.profile?.bio || '',
    experienceLevel: user?.profile?.experienceLevel || '',
    category: user?.profile?.category || '',
    skills: (user?.profile?.skills || []).join(', '),
    linkedinUrl: user?.profile?.linkedinUrl || '',
    portfolioUrl: user?.profile?.portfolioUrl || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Make sure this line exists! It splits the string "django, python" into ["django", "python"]
      const skills = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        fullName: form.fullName.trim(),
        bio: form.bio.trim(),
        experienceLevel: form.experienceLevel,
        category: form.category,
        skills: skills, // <- Now it uses the variable we just created
      };

      if (form.linkedinUrl.trim()) payload.linkedinUrl = form.linkedinUrl.trim();
      if (form.portfolioUrl.trim()) payload.portfolioUrl = form.portfolioUrl.trim();

      await api.patch('/users/profile', payload);
      await refreshUser();
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Complete your profile</h2>
          <p className="text-sm text-text-muted">
            Required to unlock projects, applications, and workspaces.
          </p>
        </div>
        <button onClick={logout} className="text-xs text-text-subtle hover:text-status-danger">
          Logout
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-status-danger/40 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />

        <div>
          <label className="label">Bio</label>
          <textarea
            className="input"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Experience Level</label>
            <select
              className="input"
              value={form.experienceLevel}
              onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
              required
            >
              <option value="">Select…</option>
              {EXPERIENCE_LEVELS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              <option value="">Select…</option>
              {CATEGORIES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Skills (comma-separated)"
          placeholder="node.js, react, mongodb"
          value={form.skills}
          onChange={(e) => setForm({ ...form, skills: e.target.value })}
          required
        />

        <Input
          label="LinkedIn URL (optional)"
          type="url"
          placeholder="https://linkedin.com/in/yourname"
          value={form.linkedinUrl}
          onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
        />
        <Input
          label="Portfolio URL (optional)"
          type="url"
          placeholder="https://yourportfolio.dev"
          value={form.portfolioUrl}
          onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
        />

        <Button type="submit" loading={loading} className="w-full">
          Save Profile
        </Button>
      </form>
    </div>
  );
}