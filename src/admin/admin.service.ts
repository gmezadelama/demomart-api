import { Injectable } from '@nestjs/common';
import { SeedRunnerService } from './seed-runner.service';
import { AdminCleanupService } from './admin-cleanup.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly seedRunnerService: SeedRunnerService,
    private readonly cleanupRunnerService: AdminCleanupService,
  ) {}

  async seedDemo() {
    await this.seedRunnerService.run();
    return { ok: true, seeded: true };
  }

  async resetDemo() {
    await this.cleanupRunnerService.wipeDemoData();
    await this.seedRunnerService.run();
    return { ok: true, reset: true, reseeded: true };
  }
}
