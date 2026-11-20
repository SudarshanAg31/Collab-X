import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];
const CATEGORIES = ['web', 'mobile', 'ai_ml', 'devops', 'blockchain', 'game', 'other'];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.profile?.fullName || '',
    bio: user?.profile?.bio || '',
    experienceLevel: user?.profile?.experienceLevel || '',
    category: user?.profile?.category || '',
    skills: (user?.profile?.skills || []).join(', '),
    linkedinUrl: user?.profile?.linkedinUrl || '',
    portfolioUrl: user?.profile?.portfolioUrl || '',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      const payload = {
        fullName: form.fullName.trim(),
        bio: form.bio.trim(),
        experienceLevel: form.experienceLevel,
        category: form.category,
        skills,
      };
      if (form.linkedinUrl.trim()) payload.linkedinUrl = form.linkedinUrl.trim();
      if (form.portfolioUrl.trim()) payload.portfolioUrl = form.portfolioUrl.trim();

      await api.patch('/users/profile', payload);
      await refreshUser();
      setMsg('Profile updated successfully!');
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="mt-1 text-sm text-text-muted">Manage how others see you on CollabX.</p>
      </div>

      <form onSubmit={onSubmit} className="card p-8 space-y-5">
        {msg && (
          <div className={`p-3 rounded-lg text-sm border ${msg.includes('Error') ? 'border-status-danger/40 bg-status-danger/10 text-status-danger' : 'border-status-success/40 bg-status-success/10 text-status-success'}`}>
            {msg}
          </div>
        )}

        <Input label="Full Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
        
        <div>
          <label className="label">Bio</label>
          <textarea className="input" rows={3} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Experience Level</label>
            <select className="input" value={form.experienceLevel} onChange={e => setForm({...form, experienceLevel: e.target.value})} required>
              {EXPERIENCE_LEVELS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
              {CATEGORIES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <Input label="Skills (comma-separated)" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} required />
        <Input label="LinkedIn URL (optional)" type="url" value={form.linkedinUrl} onChange={e => setForm({...form, linkedinUrl: e.target.value})} />
        <Input label="Portfolio URL (optional)" type="url" value={form.portfolioUrl} onChange={e => setForm({...form, portfolioUrl: e.target.value})} />

        <Button type="submit" loading={loading} className="w-full">Save Changes</Button>
      </form>
    </div>
  );
}