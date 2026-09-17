import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { Job } from '../entities/job.entity';

export interface JobEventPayload {
  type: 'JOB_CREATED' | 'JOB_UPDATED' | 'JOB_DELETED';
  job?: Job;
  jobId?: string;
  timestamp: string;
}

@Injectable()
export class JobEventsService {
  private readonly eventsSubject = new Subject<{ data: JobEventPayload }>();

  /**
   * Returns observable stream for SSE subscribers
   */
  getEventStream(): Observable<{ data: JobEventPayload }> {
    return this.eventsSubject.asObservable();
  }

  /**
   * Broadcast job creation event
   */
  emitJobCreated(job: Job) {
    this.eventsSubject.next({
      data: {
        type: 'JOB_CREATED',
        job,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Broadcast job status update event
   */
  emitJobUpdated(job: Job) {
    this.eventsSubject.next({
      data: {
        type: 'JOB_UPDATED',
        job,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Broadcast job deletion event
   */
  emitJobDeleted(jobId: string) {
    this.eventsSubject.next({
      data: {
        type: 'JOB_DELETED',
        jobId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
