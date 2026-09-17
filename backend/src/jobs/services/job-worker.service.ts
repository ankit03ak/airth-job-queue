import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';
import { JobStatus } from '../enums/job-status.enum';
import { JobEventsService } from '../events/job-events.service';

@Injectable()
export class JobWorkerService {
  private readonly logger = new Logger(JobWorkerService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly jobEventsService: JobEventsService,
  ) {}

  /**
   * Simulates asynchronous job execution when status changes to RUNNING.
   */
  async processJobAsync(jobId: string, durationMs: number = 5000) {
    this.logger.log(`[Worker] Started background processing for Job ID: ${jobId}`);

    setTimeout(async () => {
      try {
        const job = await this.jobRepository.findOne({ where: { id: jobId } });
        if (!job || job.status !== JobStatus.RUNNING) {
          this.logger.warn(
            `[Worker] Job ${jobId} was modified or deleted prior to worker completion. Current status: ${job?.status}`,
          );
          return;
        }

        // Simulate 90% success rate, 10% failure rate
        const finalStatus =
          Math.random() > 0.1 ? JobStatus.COMPLETED : JobStatus.FAILED;

        const updateResult = await this.jobRepository
          .createQueryBuilder()
          .update(Job)
          .set({
            status: finalStatus,
            updatedAt: new Date(),
          })
          .where('id = :id AND status = :expectedStatus', {
            id: jobId,
            expectedStatus: JobStatus.RUNNING,
          })
          .execute();

        if (updateResult.affected! > 0) {
          const updatedJob = await this.jobRepository.findOne({
            where: { id: jobId },
          });
          if (updatedJob) {
            this.logger.log(
              `[Worker] Job ${jobId} finished processing -> ${finalStatus}`,
            );
            this.jobEventsService.emitJobUpdated(updatedJob);
          }
        }
      } catch (err) {
        this.logger.error(
          `[Worker] Error during job ${jobId} processing: ${err.message}`,
        );
      }
    }, durationMs);
  }
}
