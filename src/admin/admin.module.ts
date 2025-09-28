import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminCleanupService } from './admin-cleanup.service';
import { AdminService } from './admin.service';
import { SeedRunnerService } from './seed-runner.service';
import { PrismaService } from 'src/common/prisma.service';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminCleanupService,
    PrismaService,
    SeedRunnerService,
  ],
})
export class AdminModule {}
