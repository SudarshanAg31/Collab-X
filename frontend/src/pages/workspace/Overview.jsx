import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, UserMinus, Check, X, GitCommit } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { relativeTime } from '../../utils/format';

export default function Overview() {
  const { project } = useOutletContext();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const isOwner = user?.id === project.owner;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Load workspace data
        const workspaceRes = await api.get(`/projects/${project.id}/workspace`);
        
        // Load leave requests if owner
        let leaveRes = { data: { requests: [] } };
        if (isOwner) {
          leaveRes = await api.get(`/projects/${project.id}/leave-requests`);
        }

        if (!cancelled) {
          setData(workspaceRes.data);
          setLeaveRequests(leaveRes.data.requests || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [project.id, isOwner]);

  async function handleLeaveAction(requestId, action) {
    setBusyId(requestId);
    try {
      await api.post(`/projects/${project.id}/leave-requests/${requestId}/${action}`);
      setLeaveRequests(prev => prev.filter(r => r._id !== requestId));
      // Refresh workspace data to update team count
      const workspaceRes = await api.get(`/projects/${project.id}/workspace`);
      setData(workspaceRes.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="py-12 flex justify-center"><Spinner /></div>;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* PENDING LEAVE REQUESTS (Owner only) */}
        {isOwner && leaveRequests.length > 0 && (
          <div className="card p-6 border-status-warning/30">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-status-warning">
              <UserMinus size={18} /> Pending Leave Requests
            </h2>
            <div className="space-y-3">
              {leaveRequests.map(req => (
                <div key={req._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-bg-elevated rounded-lg border border-bg-border">
                  <div>
                    <p className="font-semibold">{req.user?.fullName || req.user?.username} wants to leave</p>
                    <p className="text-sm text-text-muted mt-1">Reason: {req.reason}</p>
                    <p className="text-xs text-text-subtle mt-1">Requested {relativeTime(req.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      onClick={() => handleLeaveAction(req._id, 'reject')}
                      disabled={busyId === req._id}
                      className="px-3 py-1"
                    >
                      <X size={14} className="mr-1" /> Reject
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => handleLeaveAction(req._id, 'approve')}
                      loading={busyId === req._id}
                      className="px-3 py-1"
                    >
                      <Check size={14} className="mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Project Details</h2>
          <p className="text-sm text-text-muted mb-4">{project.description}</p>
          <div className="flex flex-wrap gap-2">
            {(project.techStack || []).map((t) => (
              <span key={t} className="rounded-md border border-bg-border bg-bg-elevated px-2 py-0.5 text-xs">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-subtle mb-4">Team Status</h2>
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-accent-violet" />
            <div>
              <p className="text-2xl font-bold">{data.team.activeCount} / {data.team.slotsTotal}</p>
              <p className="text-xs text-text-muted">Members</p>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            {data.team.members.map(m => (
              <div key={m.membershipId} className="flex justify-between items-center text-sm">
                <span>{m.user.fullName || m.user.username}</span>
                <Badge variant={m.role === 'owner' ? 'violet' : 'default'}>{m.role}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}