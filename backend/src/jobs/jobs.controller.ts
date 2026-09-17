import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Sse,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { JobStatus } from './enums/job-status.enum';
import { JobEventsService, JobEventPayload } from './events/job-events.service';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobEventsService: JobEventsService,
  ) {}

  /**
   * POST /jobs — Create a new job
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(createJobDto);
  }

  /**
   * GET /jobs — Get all jobs (optional status filter)
   */
  @Get()
  findAll(@Query('status') status?: JobStatus) {
    return this.jobsService.findAll(status);
  }

  /**
   * GET /jobs/sse/stream — Real-time event stream for multi-tab UI sync
   */
  @Sse('sse/stream')
  streamEvents(): Observable<{ data: JobEventPayload }> {
    return this.jobEventsService.getEventStream();
  }

  /**
   * GET /jobs/:id — Get a single job by ID
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findOne(id);
  }

  /**
   * PATCH /jobs/:id/status — Update job status
   */
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateJobStatusDto: UpdateJobStatusDto,
  ) {
    return this.jobsService.updateStatus(id, updateJobStatusDto);
  }

  /**
   * DELETE /jobs/:id — Delete a job
   */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.remove(id);
  }
}
