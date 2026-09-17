import { CreateJobPayload, Job, JobStatus, JobsResponse } from '../types/job';

// Base API URL dynamically derived from ENV or relative proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  statusCode?: number;
  error?: string;

  constructor(message: string, statusCode?: number, error?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
  }
}

export const fetchJobs = async (statusFilter?: JobStatus): Promise<JobsResponse> => {
  const url = statusFilter
    ? `${API_BASE_URL}/jobs?status=${statusFilter}`
    : `${API_BASE_URL}/jobs`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || 'Failed to fetch jobs',
      response.status,
      errorData.error,
    );
  }

  return response.json();
};

export const createJob = async (payload: CreateJobPayload): Promise<Job> => {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message || 'Failed to create job';
    throw new ApiError(message, response.status, errorData.error);
  }

  return response.json();
};

export const updateJobStatus = async (
  id: string,
  status: JobStatus,
): Promise<Job> => {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message || 'Failed to update job status';
    throw new ApiError(message, response.status, errorData.error);
  }

  return response.json();
};

export const deleteJob = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || 'Failed to delete job',
      response.status,
      errorData.error,
    );
  }
};

export const getSSEEventSource = (): EventSource => {
  return new EventSource(`${API_BASE_URL}/jobs/sse/stream`);
};
