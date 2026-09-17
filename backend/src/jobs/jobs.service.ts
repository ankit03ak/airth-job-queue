import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { JobStatus } from './enums/job-status.enum';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { JobStateMachine } from './utils/job-state-machine';
import { JobEventsService } from './events/job-events.service';
import { JobWorkerService } from './services/job-worker.service';

export interface JobCounts {
  all: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly jobEventsService: JobEventsService,
    private readonly jobWorkerService: JobWorkerService,
  ) {}

  /**
   * Create a new job with default PENDING status
   */
  async create(createJobDto: CreateJobDto): Promise<Job> {
    const job = this.jobRepository.create({
      title: createJobDto.title.trim(),
      type: createJobDto.type.trim(),
      status: JobStatus.PENDING,
    });

    const savedJob = await this.jobRepository.save(job);
    this.jobEventsService.emitJobCreated(savedJob);
    return savedJob;
  }

  /**
   * Fetch all jobs (with optional status filter) and counts breakdown
   */
  async findAll(statusFilter?: JobStatus): Promise<{ jobs: Job[]; counts: JobCounts }> {
    const queryBuilder = this.jobRepository.createQueryBuilder('job');

    if (statusFilter) {
      queryBuilder.where('job.status = :status', { status: statusFilter });
    }

    const jobs = await queryBuilder.orderBy('job.createdAt', 'DESC').getMany();

    // Calculate count totals across all statuses
    const allStatusRows = await this.jobRepository.find({ select: { id: true, status: true } });
    const counts: JobCounts = {
      all: allStatusRows.length,
      pending: allStatusRows.filter((j) => j.status === JobStatus.PENDING).length,
      running: allStatusRows.filter((j) => j.status === JobStatus.RUNNING).length,
      completed: allStatusRows.filter((j) => j.status === JobStatus.COMPLETED).length,
      failed: allStatusRows.filter((j) => j.status === JobStatus.FAILED).length,
    };

    return { jobs, counts };
  }

  /**
   * Find a single job by ID
   */
  async findOne(id: string): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job with ID '${id}' not found.`);
    }
    return job;
  }

  /**
   * Update job status with strict state machine validation & atomic concurrency protection
   */
  async updateStatus(
    id: string,
    updateJobStatusDto: UpdateJobStatusDto,
  ): Promise<Job> {
    const currentJob = await this.findOne(id);
    const newStatus = updateJobStatusDto.status;

    // 1. Enforce State Machine Validation
    if (!JobStateMachine.canTransition(currentJob.status, newStatus)) {
      const errorMessage = JobStateMachine.getErrorMessage(
        currentJob.status,
        newStatus,
      );
      throw new BadRequestException(errorMessage);
    }

    // 2. Perform Atomic Update guarded by expected current status
    const updateResult = await this.jobRepository
      .createQueryBuilder()
      .update(Job)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where('id = :id AND status = :expectedStatus', {
        id,
        expectedStatus: currentJob.status,
      })
      .execute();

    // 3. Handle Concurrency Conflict if 0 rows were updated
    if (updateResult.affected === 0) {
      const latestState = await this.jobRepository.findOne({ where: { id } });
      if (!latestState) {
        throw new NotFoundException(`Job with ID '${id}' no longer exists.`);
      }

      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: `Race Condition: Concurrent update detected! Job status was modified from '${currentJob.status}' to '${latestState.status}' by another request.`,
        currentStatus: latestState.status,
        requestedStatus: newStatus,
      });
    }

    const updatedJob = await this.findOne(id);
    this.jobEventsService.emitJobUpdated(updatedJob);

    // 4. Trigger Background Worker Queue processing when job moves to RUNNING
    if (newStatus === JobStatus.RUNNING) {
      this.jobWorkerService.processJobAsync(id);
    }

    return updatedJob;
  }

  /**
   * Delete a job by ID
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const job = await this.findOne(id);
    await this.jobRepository.remove(job);
    this.jobEventsService.emitJobDeleted(id);
    return {
      success: true,
      message: `Job '${job.title}' (ID: ${id}) deleted successfully.`,
    };
  }
}
