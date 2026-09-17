import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { CreateJobPayload } from '../types/job';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateJobPayload) => Promise<void>;
}

const PRESET_TYPES = [
  'EMAIL_NOTIFICATION',
  'DATA_EXPORT',
  'IMAGE_PROCESSING',
  'REPORT_GENERATION',
  'DATABASE_BACKUP',
  'CUSTOM',
];

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('EMAIL_NOTIFICATION');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !type.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), type: type.trim() });
      setTitle('');
      setType('EMAIL_NOTIFICATION');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-sky-400" />
            <h3 className="text-lg font-bold text-white">Create New Job</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Job Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Job Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Process Monthly Payroll Exports"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Job Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Job Category / Type
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {PRESET_TYPES.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                    type === t
                      ? 'border-sky-500/50 bg-sky-500/10 text-sky-400'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Custom type..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Job'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
