import React from 'react';
import { Layers, Plus, RefreshCw, Radio } from 'lucide-react';

interface HeaderProps {
  onOpenCreateModal: () => void;
  onRefresh: () => void;
  isLiveConnected: boolean;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateModal,
  onRefresh,
  isLiveConnected,
  isLoading,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                TaskPulse
              </h1>
              <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
                Job Queue
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              NestJS + React Concurrency & State Machine Dashboard
            </p>
          </div>
        </div>

        {/* Action Controls & Realtime Indicator */}
        <div className="flex items-center space-x-3">
          {/* Live SSE Status Badge */}
          <div
            className={`hidden md:flex items-center space-x-2 rounded-full px-3 py-1 text-xs font-medium border ${
              isLiveConnected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}
            title={
              isLiveConnected
                ? 'Real-Time SSE Live Stream Active'
                : 'Connecting to Live Stream...'
            }
          >
            <Radio
              className={`h-3.5 w-3.5 ${
                isLiveConnected ? 'animate-pulse text-emerald-400' : 'text-amber-400'
              }`}
            />
            <span>{isLiveConnected ? 'Live Sync' : 'Reconnecting'}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-white disabled:opacity-50"
            title="Refresh Jobs"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Create Job Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-500/25 transition-all hover:from-sky-400 hover:to-blue-500 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create Job</span>
          </button>
        </div>
      </div>
    </header>
  );
};
