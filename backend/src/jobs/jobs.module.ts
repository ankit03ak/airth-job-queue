import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobEventsService } from './events/job-events.service';
import { JobWorkerService } from './services/job-worker.service';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  controllers: [JobsController],
  providers: [JobsService, JobEventsService, JobWorkerService],
  exports: [JobsService],
})
export class JobsModule {}
