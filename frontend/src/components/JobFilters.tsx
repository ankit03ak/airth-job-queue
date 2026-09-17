import React from 'react';
import { JobStatus } from '../types/job';
import { Filter } from 'lucide-react';

interface JobFiltersProps {
  selectedFilter: JobStatus | 'all';
  onSelectFilter: (filter: JobStatus | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  selectedFilter,
  onSelectFilter,
  searchQuery,
  onSearchChange,
}) => {
  const filters: { id: JobStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All Jobs' },
    { id: 'pending', label: 'Pending' },
    { id: 'running', label: 'Running' },
    { id: 'completed', label: 'Completed' },
    { id: 'failed', label: 'Failed' },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto rounded-xl bg-slate-900/60 p-1 border border-slate-800">
        <div className="pl-2 text-slate-500 hidden sm:block">
          <Filter className="h-4 w-4" />
        </div>
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelectFilter(f.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFilter === f.id
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-64">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title or type..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-medium text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
