import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsModule } from './jobs/jobs.module';
import { Job } from './jobs/entities/job.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');

        return {
          type: 'postgres',
          url: dbUrl || 'postgresql://postgres:postgres@localhost:5432/postgres',
          entities: [Job],
          synchronize: true, // Automatically creates the 'jobs' table on startup
          ssl:
            dbUrl &&
            (dbUrl.includes('supabase') ||
              dbUrl.includes('render') ||
              dbUrl.includes('neon') ||
              dbUrl.includes('pooler') ||
              dbUrl.includes('sslmode='))
              ? { rejectUnauthorized: false }
              : false,
        };
      },
    }),
    JobsModule,
  ],
})
export class AppModule {}
