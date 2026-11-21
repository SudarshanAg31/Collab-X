import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const CATEGORIES = ['web', 'mobile', 'ai_ml', 'devops', 'blockchain', 'game', 'other'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function CreateProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    summary: '',
    category: '',
    techStack: '',
    githubRepoUrl: '',
    requiredMembers: 3,
    experienceLevel: 'intermediate',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Split and clean tech stack
      const techStack = form.techStack
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Create exact payload matching Postman
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        summary: form.summary.trim(),
        category: form.category,
        techStack: techStack,
        githubRepoUrl: form.githubRepoUrl.trim(),
        requiredMembers: Number(form.requiredMembers), // Ensures it's a number, not string
        experienceLevel: form.experienceLevel,
      };

      // Help debug
      console.log("SENDING PAYLOAD:", JSON.stringify(payload, null, 2));

      const { data } = await api.post('/projects', payload);
      navigate(`/projects/${data.project.id}`);
    } catch (err) {
      console.error("FULL ERROR:", err);
      // If there's a validation details array, show it
      if (err.details) {
        console.log("VALIDATION DETAILS:", err.details);
        setError(`${err.message}: ${err.details.map(d => d.path).join(', ')}`);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create a Project</h1>
        <p className="mt-1 text-sm text-text-muted">Define what you're building and who you need.</p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-5 p-8">
        {error && (
          <div className="rounded-lg border border-status-danger/40 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            {error}
          </div>
        )}

        <Input
          label="Project Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>

        <Input
          label="Short Summary"
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              <option value="">Select…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Experience Level</label>
            <select
              className="input"
              value={form.experienceLevel}
              onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
              required
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Tech Stack (comma-separated)"
          value={form.techStack}
          onChange={(e) => setForm({ ...form, techStack: e.target.value })}
          placeholder="node.js, react, mongodb"
        />

        <Input
          label="GitHub Repository URL"
          type="url"
          value={form.githubRepoUrl}
          onChange={(e) => setForm({ ...form, githubRepoUrl: e.target.value })}
          placeholder="https://github.com/owner/repo"
          required
        />

        <Input
          label="Required Members"
          type="number"
          min={1}
          max={20}
          value={form.requiredMembers}
          onChange={(e) => setForm({ ...form, requiredMembers: e.target.value })}
          required
        />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
            Cancel
          </button>
          <Button type="submit" loading={loading}>Create Project</Button>
        </div>
      </form>
    </div>
  );
}