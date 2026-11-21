import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { GitBranch, LogOut, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import { relativeTime } from '../../utils/format';

export default function TeamMembers() {
  const { project } = useOutletContext();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasPendingLeave, setHasPendingLeave] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const isOwner = user?.id === project.owner;

  useEffect(() => { 
    load(); 
    checkLeaveStatus();
  }, [project.id]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/projects/${project.id}/members`);
      setMembers(data.members || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  async function checkLeaveStatus() {
    try {
      const { data } = await api.get(`/projects/${project.id}/leave-requests/my`);
      const isPending = data.requests?.some(r => r.status === 'pending' && r.project?._id === project.id);
      setHasPendingLeave(isPending);
    } catch (err) { console.error(err); }
  }

  async function handleLeaveSubmit(e) {
    e.preventDefault();
    if (!leaveReason.trim()) return;
    setSubmittingLeave(true);
    try {
      await api.post(`/projects/${project.id}/leave-requests`, { reason: leaveReason });
      setShowLeaveModal(false);
      setLeaveReason('');
      setHasPendingLeave(true);
      alert('Leave request submitted. Waiting for admin approval.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingLeave(false);
    }
  }

  async function handleInvite(membershipId) {
    try {
      await api.post(`/projects/${project.id}/github/invite`, { membershipId });
      alert('GitHub invitation sent (or attempted).');
      load();
    } catch (err) { alert(err.message); }
  }

  if (loading) return <div className="py-12 flex justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold mb-4">Team Members ({members.length})</h2>
        
        {/* LEAVE PROJECT BUTTON (Only visible to members, not owner) */}
        {!isOwner && (
          <div>
            {hasPendingLeave ? (
              <p className="text-status-warning text-sm">Leave request pending admin approval.</p>
            ) : (
              <Button variant="secondary" onClick={() => setShowLeaveModal(true)} className="text-status-danger border-status-danger/30 hover:bg-status-danger/10">
                <LogOut size={16} className="mr-2" /> Request to Leave
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {members.map(m => {
          const isSelf = m.user.id === user.id;
          const canInvite = isOwner && m.role === 'member' && m.githubInviteStatus !== 'sent' && !isSelf;
          
          return (
            <div key={m.membershipId} className="card p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      {m.user.fullName || m.user.username}
                      {isSelf && <span className="text-[10px] bg-accent-violet/20 text-accent-violet px-1.5 py-0.5 rounded">You</span>}
                    </h3>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                      <GitBranch size={12}/> @{m.user.githubUsername}
                    </p>
                  </div>
                  <Badge variant={m.role === 'owner' ? 'violet' : 'default'}>
                    {m.role === 'owner' ? 'Admin' : 'Member'}
                  </Badge>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.user.skills?.slice(0, 5).map(s => (
                    <span key={s} className="bg-bg-elevated px-2 py-0.5 rounded text-[10px] text-text-muted">{s}</span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-bg-border flex items-center justify-between text-xs">
                <span className="text-text-subtle">Joined {relativeTime(m.joinedAt)}</span>
                
                {m.role === 'member' && (
                  <div className="flex items-center gap-2">
                    <span className="text-text-subtle">GitHub: </span>
                    <Badge variant={
                      m.githubInviteStatus === 'sent' ? 'success' :
                      m.githubInviteStatus === 'failed' ? 'danger' : 'warning'
                    }>
                      {m.githubInviteStatus}
                    </Badge>
                    {canInvite && (
                      <button onClick={() => handleInvite(m.membershipId)} className="text-accent-violet hover:underline ml-2">
                        Invite
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LEAVE MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4 text-status-warning">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Request to Leave</h3>
            </div>
            <p className="text-sm text-text-muted mb-4">
              Are you sure you want to leave this project? The admin will need to approve your request.
            </p>
            <form onSubmit={handleLeaveSubmit}>
              <label className="label">Reason for leaving</label>
              <textarea
                className="input mb-4"
                rows={3}
                placeholder="Please provide a reason..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowLeaveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submittingLeave} variant="primary">
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}