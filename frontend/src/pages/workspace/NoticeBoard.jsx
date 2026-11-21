import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/common/Spinner';
import { relativeTime } from '../../utils/format';

export default function NoticeBoard() {
  const { project } = useOutletContext();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  const isOwner = user?.id === project.owner;

  useEffect(() => { load(); }, [project.id]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/projects/${project.id}/notices`);
      setItems(data.notices || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.post(`/projects/${project.id}/notices`, form);
      setForm({ title: '', content: '' });
      setIsAdding(false);
      load();
    } catch (err) { alert(err.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await api.delete(`/projects/${project.id}/notices/${id}`);
      load();
    } catch (err) { alert(err.message); }
  }

  if (loading) return <div className="py-12 flex justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Notice Board</h2>
        {isOwner && !isAdding && (
          <button onClick={() => setIsAdding(true)} className="btn-primary text-xs">
            <Plus size={14} className="mr-2" /> Add Notice
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="card p-6 space-y-4 border-accent-violet/30">
          <input className="input" placeholder="Title" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <textarea className="input" rows={3} placeholder="Content" required value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-8">No notices yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="card p-5 flex gap-4">
              <div className="mt-1 text-text-subtle"><FileText size={18} /></div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  {isOwner && (
                    <button onClick={() => handleDelete(item.id)} className="text-text-muted hover:text-status-danger">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-text-muted whitespace-pre-wrap">{item.content}</p>
                <p className="text-xs text-text-subtle mt-3">
                  By {item.createdBy?.fullName || item.createdBy?.username} · {relativeTime(item.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}