import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';

@Injectable()
export class SeedRunnerService {
  private readonly logger = new Logger(SeedRunnerService.name);

  run(): Promise<void> {
    // ✅ no --skip-generate here
    const cmd = process.env.SEED_CMD?.trim() || 'npx prisma db seed';

    this.logger.log(`Running seed: ${cmd}`);
    return new Promise((resolve, reject) => {
      const child = exec(cmd, {
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
        env: process.env,
      });
      child.stdout?.on('data', (d) => this.logger.log(d.toString().trim()));
      child.stderr?.on('data', (d) => this.logger.error(d.toString().trim()));
      child.on('error', reject);
      child.on('close', (code) =>
        code === 0 ? resolve() : reject(new Error(`Seed exited ${code}`)),
      );
    });
  }
}
