import React, { useState } from 'react';
import { Job, JobStatus } from '../types/job';
import {
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Trash2,
  Calendar,
  Tag,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface JobCardProps {
  job: Job;
  onUpdateStatus: (id: string, newStatus: JobStatus) => Promise<void>;
  onDeleteJob: (id: string) => Promise<void>;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onUpdateStatus,
  onDeleteJob,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: JobStatus) => {
    setIsUpdating(true);
    setActionError(null);
    try {
      await onUpdateStatus(job.id, newStatus);
    } catch (err: any) {
      setActionError(err.message || 'Transition failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${job.title}"?`)) return;
    setIsDeleting(true);
    try {
      await onDeleteJob(job.id);
    } catch (err: any) {
      setActionError(err.message || 'Delete failed');
      setIsDeleting(false);
    }
  };

  // Status Styling Map
  const statusConfig = {
    pending: {
      label: 'Pending',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Clock,
    },
    running: {
      label: 'Running',
      badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      icon: Play,
    },
    completed: {
      label: 'Completed',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2,
    },
    failed: {
      label: 'Failed',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: XCircle,
    },
  };

  const currentStatus = statusConfig[job.status] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;

  const formattedDate = new Date(job.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm transition-all hover:border-slate-700 hover:shadow-xl hover:shadow-black/30">
      {/* Top Section */}
      <div>
        <div className="flex items-start justify-between gap-3">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center space-x-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${currentStatus.badgeClass}`}
          >
            <StatusIcon
              className={`h-3.5 w-3.5 ${
                job.status === 'running' ? 'animate-spin text-sky-400' : ''
              }`}
            />
            <span className="capitalize">{currentStatus.label}</span>
          </span>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting || isUpdating}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-30"
            title="Delete Job"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-base font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-2">
          {job.title}
        </h3>

        {/* Metadata */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <Tag className="h-3 w-3 text-sky-400" />
            <span className="font-medium text-slate-300">{job.type}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Calendar className="h-3 w-3 text-slate-500" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Action Error Alert */}
        {actionError && (
          <div className="mt-3 flex items-start space-x-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}
      </div>

      {/* Action Controls matching State Machine */}
      <div className="mt-5 pt-3 border-t border-slate-800/80">
        {job.status === 'pending' && (
          <button
            onClick={() => handleStatusChange('running')}
            disabled={isUpdating}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-sky-500/10 border border-sky-500/30 py-2 text-xs font-semibold text-sky-400 transition-all hover:bg-sky-500 hover:text-white disabled:opacity-50"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Start Job (Set Running)</span>
              </>
            )}
          </button>
        )}

        {job.status === 'running' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleStatusChange('completed')}
              disabled={isUpdating}
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500 hover:text-white disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Complete</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleStatusChange('failed')}
              disabled={isUpdating}
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 py-2 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500 hover:text-white disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Fail</span>
                </>
              )}
            </button>
          </div>
        )}

        {(job.status === 'completed' || job.status === 'failed') && (
          <div className="text-center text-[11px] font-medium text-slate-500 italic py-1">
            Terminal state reached ({job.status})
          </div>
        )}
      </div>
    </div>
  );
};
