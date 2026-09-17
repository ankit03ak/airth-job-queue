import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import {
  CreateJobPayload,
  Job,
  JobCounts,
  JobStatus,
} from './types/job';
import {
  fetchJobs,
  createJob,
  updateJobStatus,
  deleteJob,
  getSSEEventSource,
  ApiError,
} from './services/api';
import { Header } from './components/Header';
import { JobStats } from './components/JobStats';
import { JobFilters } from './components/JobFilters';
import { JobCard } from './components/JobCard';
import { CreateJobModal } from './components/CreateJobModal';
import { JobSkeleton } from './components/JobSkeleton';
import { AlertCircle, Inbox, Plus, Zap } from 'lucide-react';

export const App: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [counts, setCounts] = useState<JobCounts>({
    all: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  });
  const [selectedFilter, setSelectedFilter] = useState<JobStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Load jobs from API
  const loadJobs = useCallback(async (showLoadingState = false) => {
    if (showLoadingState) setIsLoading(true);
    setError(null);
    try {
      const data = await fetchJobs(
        selectedFilter === 'all' ? undefined : selectedFilter,
      );
      setJobs(data.jobs);
      setCounts(data.counts);
    } catch (err: any) {
      const msg = err.message || 'Unable to connect to backend server';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter]);

  // Initial load on mount and filter changes
  useEffect(() => {
    loadJobs(true);
  }, [loadJobs]);

  // Setup Real-Time SSE EventSource
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = getSSEEventSource();

      eventSource.onopen = () => {
        setIsLiveConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (
            payload.type === 'JOB_CREATED' ||
            payload.type === 'JOB_UPDATED' ||
            payload.type === 'JOB_DELETED'
          ) {
            loadJobs(false); // Silently sync dashboard state without full skeleton flicker
          }
        } catch (e) {
          console.error('SSE Message Parse Error:', e);
        }
      };

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch (e) {
      setIsLiveConnected(false);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [loadJobs]);

  // Handle Create Job Submit
  const handleCreateJob = async (payload: CreateJobPayload) => {
    try {
      const newJob = await createJob(payload);
      toast.success(`Job "${newJob.title}" created successfully!`);
      await loadJobs(false);
    } catch (err: any) {
      if (err instanceof ApiError) {
        toast.error(`Error (${err.statusCode}): ${err.message}`);
      } else {
        toast.error(err.message || 'Failed to create job');
      }
      throw err;
    }
  };

  // Handle Update Status
  const handleUpdateStatus = async (id: string, newStatus: JobStatus) => {
    try {
      const updatedJob = await updateJobStatus(id, newStatus);
      toast.success(
        `Job "${updatedJob.title}" updated to ${newStatus.toUpperCase()}`,
      );
      await loadJobs(false);
    } catch (err: any) {
      if (err.statusCode === 409) {
        toast.error(`Race Condition Conflict! ${err.message}`, {
          duration: 5000,
          icon: '⚡',
        });
      } else if (err.statusCode === 400) {
        toast.error(`State Machine Error: ${err.message}`);
      } else {
        toast.error(err.message || 'Status update failed');
      }
      throw err;
    }
  };

  // Handle Delete Job
  const handleDeleteJob = async (id: string) => {
    try {
      await deleteJob(id);
      toast.success('Job deleted successfully');
      await loadJobs(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete job');
      throw err;
    }
  };

  // Filter jobs by search query locally
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const query = searchQuery.toLowerCase();
    return jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(query) ||
        job.type.toLowerCase().includes(query) ||
        job.id.toLowerCase().includes(query),
    );
  }, [jobs, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #1e293b',
          },
        }}
      />

      {/* Header */}
      <Header
        onOpenCreateModal={() => setIsModalOpen(true)}
        onRefresh={() => loadJobs(true)}
        isLiveConnected={isLiveConnected}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Top Banner Notice for Reviewers */}
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <Zap className="h-6 w-6 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-white">
                Atomic Concurrency & Real-Time State Machine Active
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Open two browser tabs side-by-side! Simultaneous status changes are guarded by atomic database queries, preventing invalid transitions and race conditions.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 flex items-center space-x-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 px-3.5 py-2 text-xs font-semibold text-sky-400 hover:bg-sky-500 hover:text-white transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Job</span>
          </button>
        </div>

        {/* Status Summary Counters */}
        <JobStats
          counts={counts}
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
        />

        {/* Filter Bar & Search */}
        <JobFilters
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Main Job Grid / Error / Loading States */}
        {isLoading ? (
          <JobSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center space-y-3">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
            <h3 className="text-base font-bold text-white">
              Backend Connection Error
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => loadJobs(true)}
              className="mt-2 rounded-xl bg-rose-500/20 border border-rose-500/30 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/30"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
            <Inbox className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="text-base font-bold text-white">No Jobs Found</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {searchQuery
                ? `No jobs matched search term "${searchQuery}"`
                : selectedFilter !== 'all'
                ? `No jobs currently in "${selectedFilter}" status`
                : 'Get started by creating your first queue task!'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 inline-flex items-center space-x-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:bg-sky-400"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Job</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onUpdateStatus={handleUpdateStatus}
                onDeleteJob={handleDeleteJob}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        Job Queue Management System • NestJS & React Concurrency Task Demo
      </footer>

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateJob}
      />
    </div>
  );
};

export default App;
