export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export type JobType =
  | 'EMAIL_NOTIFICATION'
  | 'DATA_EXPORT'
  | 'IMAGE_PROCESSING'
  | 'REPORT_GENERATION'
  | 'DATABASE_BACKUP'
  | 'CUSTOM';

export interface Job {
  id: string;
  title: string;
  type: string;
  status: JobStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobCounts {
  all: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export interface CreateJobPayload {
  title: string;
  type: string;
}

export interface JobsResponse {
  jobs: Job[];
  counts: JobCounts;
}
