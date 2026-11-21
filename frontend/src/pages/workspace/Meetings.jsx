import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, MapPin, Clock, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/format';

export default function Meetings() {
  const { project } = useOutletContext();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ meetingDate: '', meetingTime: '', venue: '', agenda: '' });

  const isOwner = user?.id === project.owner;

  useEffect(() => { load(); }, [project.id]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/projects/${project.id}/meetings`);
      setItems(data.meetings || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.post(`/projects/${project.id}/meetings`, form);
      setForm({ meetingDate: '', meetingTime: '', venue: '', agenda: '' });
      setIsAdding(false);
      load();
    } catch (err) { alert(err.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this meeting?')) return;
    try {
      await api.delete(`/projects/${project.id}/meetings/${id}`);
      load();
    } catch (err) { alert(err.message); }
  }

  if (loading) return <div className="py-12 flex justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Offline Meetings</h2>
        {isOwner && !isAdding && (
          <button onClick={() => setIsAdding(true)} className="btn-primary text-xs">
            <Plus size={14} className="mr-2" /> Schedule Meeting
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="card p-6 space-y-4 border-accent-violet/30">
          <div className="grid grid-cols-2 gap-4">
            <input type="date" className="input" required value={form.meetingDate} onChange={e => setForm({...form, meetingDate: e.target.value})} />
            <input type="time" className="input" required value={form.meetingTime} onChange={e => setForm({...form, meetingTime: e.target.value})} />
          </div>
          <input className="input" placeholder="Venue" required value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} />
          <textarea className="input" rows={3} placeholder="Agenda" required value={form.agenda} onChange={e => setForm({...form, agenda: e.target.value})} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-8">No meetings scheduled.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(item => (
            <div key={item.id} className="card p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-accent-violet font-medium">
                  <Calendar size={16} /> {formatDate(item.meetingDate)}
                </div>
                {isOwner && (
                  <button onClick={() => handleDelete(item.id)} className="text-text-muted hover:text-status-danger">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="space-y-2 text-sm text-text-muted">
                <p className="flex items-center gap-2"><Clock size={14} /> {item.meetingTime}</p>
                <p className="flex items-center gap-2"><MapPin size={14} /> {item.venue}</p>
                <p className="mt-3 pt-3 border-t border-bg-border">{item.agenda}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}