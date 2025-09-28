import { Controller, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminTokenGuard } from './admin-token.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('demo/seed')
  @UseGuards(AdminTokenGuard)
  async seedDemo() {
    return this.adminService.seedDemo();
  }

  @Post('demo/reset')
  async resetDemo() {
    return this.adminService.resetDemo();
  }
}
