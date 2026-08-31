import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { ApiResponse } from '@repo/contracts/common';
import {
  type CreateTransaction,
  CreateTransactionSchema,
  type Transaction,
  type TransactionListQuery,
  TransactionListQuerySchema,
  type UpdateTransaction,
  UpdateTransactionSchema,
} from '@repo/contracts/transactions';
import { LoggingInterceptor , ZodValidationPipe } from '@repo/nestjs-shared';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(ApiKeyGuard)
@UseInterceptors(LoggingInterceptor)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async findAll(
    @Headers('x-user-id') userId: string,
    @Query(new ZodValidationPipe(TransactionListQuerySchema)) query: TransactionListQuery,
  ): Promise<ApiResponse<Transaction[]>> {
    return this.transactionsService.findAll(userId, query);
  }

  @Post()
  @HttpCode(201)
  async create(
    @Headers('x-user-id') userId: string,
    @Body(new ZodValidationPipe(CreateTransactionSchema)) body: CreateTransaction,
  ): Promise<ApiResponse<Transaction>> {
    const transaction = await this.transactionsService.create(userId, body);
    return { data: transaction };
  }

  @Get(':id')
  async findOne(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ): Promise<ApiResponse<Transaction>> {
    const transaction = await this.transactionsService.findOne(userId, id);
    return { data: transaction };
  }

  @Put(':id')
  async update(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTransactionSchema)) body: UpdateTransaction,
  ): Promise<ApiResponse<Transaction>> {
    const transaction = await this.transactionsService.update(userId, id, body);
    return { data: transaction };
  }

  @Delete(':id')
  async remove(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ): Promise<ApiResponse<null>> {
    await this.transactionsService.remove(userId, id);
    return { data: null };
  }
}
