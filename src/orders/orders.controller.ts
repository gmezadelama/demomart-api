import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { OrdersService } from './orders.service';
import {
  CreateOrderBodySchema,
  type CreateOrderBody,
} from './schemas/create-order.schema';
import {
  IdParamSchema,
  type IdParam,
  PaginationQuerySchema,
  type PaginationQuery,
  UserOrdersParamSchema,
  type UserOrdersParam,
} from './schemas/get-order.schema';
import type { PipeTransform } from '@nestjs/common';

class ZodValidationPipe<T extends z.ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}
  transform(value: unknown) {
    const res = this.schema.safeParse(value);
    if (!res.success) {
      throw new BadRequestException({
        ok: false,
        error: 'ValidationError',
        issues: res.error.issues,
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return res.data;
  }
}

@Controller('api/v1')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('orders')
  async createOrder(
    @Body(new ZodValidationPipe(CreateOrderBodySchema)) body: CreateOrderBody,
  ) {
    return this.orders.createOrder(body);
  }

  @Get('orders/:id')
  async getOrderById(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParam,
  ) {
    return this.orders.getOrderById(params.id);
  }

  @Get('users/:id/orders')
  async getOrdersByUser(
    @Param(new ZodValidationPipe(UserOrdersParamSchema))
    params: UserOrdersParam,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQuery,
  ) {
    return this.orders.getOrdersByUser(params.id, query);
  }
}
