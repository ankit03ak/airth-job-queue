import React from 'react';
import { JobCounts, JobStatus } from '../types/job';
import { Clock, Play, CheckCircle2, XCircle, LayoutGrid } from 'lucide-react';

interface JobStatsProps {
  counts: JobCounts;
  selectedFilter: JobStatus | 'all';
  onSelectFilter: (filter: JobStatus | 'all') => void;
}

export const JobStats: React.FC<JobStatsProps> = ({
  counts,
  selectedFilter,
  onSelectFilter,
}) => {
  const statItems = [
    {
      id: 'all' as const,
      label: 'All Jobs',
      count: counts.all,
      icon: LayoutGrid,
      color: 'text-slate-300',
      bgColor: 'bg-slate-800/80',
      borderColor: 'border-slate-700',
      activeRing: 'ring-2 ring-slate-400',
    },
    {
      id: 'pending' as const,
      label: 'Pending',
      count: counts.pending,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      activeRing: 'ring-2 ring-amber-400',
    },
    {
      id: 'running' as const,
      label: 'Running',
      count: counts.running,
      icon: Play,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/30',
      activeRing: 'ring-2 ring-sky-400',
    },
    {
      id: 'completed' as const,
      label: 'Completed',
      count: counts.completed,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      activeRing: 'ring-2 ring-emerald-400',
    },
    {
      id: 'failed' as const,
      label: 'Failed',
      count: counts.failed,
      icon: XCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      activeRing: 'ring-2 ring-rose-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {statItems.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedFilter === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectFilter(item.id)}
            className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all hover:scale-[1.02] ${
              item.bgColor
            } ${item.borderColor} ${
              isSelected ? `${item.activeRing} shadow-lg shadow-black/40` : 'opacity-85 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {item.label}
              </span>
              <Icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white sm:text-3xl">
                {item.count}
              </span>
              {isSelected && (
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                  Filtered
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
