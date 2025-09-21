import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('demo')
  getDemo() {
    return this.users.getDemoUsers();
  }

  @Get(':id/orders')
  getUserOrders(@Param('id') id: string) {
    return this.users.getUserOrders(id);
  }

  @Get(':id/wishlist')
  getUserWishlist(@Param('id') id: string) {
    return this.users.getUserWishlist(id);
  }
}
