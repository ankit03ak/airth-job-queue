import React from 'react';

export const JobSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 rounded-full bg-slate-800" />
            <div className="h-5 w-6 rounded bg-slate-800" />
          </div>
          <div className="h-6 w-3/4 rounded bg-slate-800" />
          <div className="flex items-center space-x-2">
            <div className="h-5 w-20 rounded bg-slate-800" />
            <div className="h-5 w-16 rounded bg-slate-800" />
          </div>
          <div className="pt-3 border-t border-slate-800/60">
            <div className="h-9 w-full rounded-xl bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
};
