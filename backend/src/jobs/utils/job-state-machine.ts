import { JobStatus } from '../enums/job-status.enum';

export class JobStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
    [JobStatus.PENDING]: [JobStatus.RUNNING],
    [JobStatus.RUNNING]: [JobStatus.COMPLETED, JobStatus.FAILED],
    [JobStatus.COMPLETED]: [],
    [JobStatus.FAILED]: [],
  };

  /**
   * Validates if state transition from currentStatus to nextStatus is allowed.
   */
  public static canTransition(
    currentStatus: JobStatus,
    nextStatus: JobStatus,
  ): boolean {
    if (currentStatus === nextStatus) return false; // Job is already in target status
    const allowedNext = this.ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowedNext.includes(nextStatus);
  }

  /**
   * Returns a detailed human-readable error message explaining why a transition failed.
   */
  public static getErrorMessage(
    currentStatus: JobStatus,
    nextStatus: JobStatus,
  ): string {
    if (currentStatus === nextStatus) {
      return `Job is already in '${currentStatus}' status.`;
    }

    if (
      currentStatus === JobStatus.COMPLETED ||
      currentStatus === JobStatus.FAILED
    ) {
      return `Job is in a terminal state ('${currentStatus}') and cannot be changed to '${nextStatus}'.`;
    }

    const allowed = this.ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed || allowed.length === 0) {
      return `Cannot change status from '${currentStatus}' to '${nextStatus}'.`;
    }

    return `Invalid state transition from '${currentStatus}' to '${nextStatus}'. Allowed next status(es): [${allowed.join(', ')}].`;
  }
}
