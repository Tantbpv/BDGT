import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Account, CreateAccount } from '@repo/contracts/accounts';
import { CreateAccountSchema } from '@repo/contracts/accounts';
import type { ApiResponse } from '@repo/contracts/common';
import { LoggingInterceptor , ZodValidationPipe } from '@repo/nestjs-shared';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { AccountsService } from './accounts.service';

@Controller('accounts')
@UseGuards(ApiKeyGuard)
@UseInterceptors(LoggingInterceptor)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async findAll(@Headers('x-user-id') userId: string): Promise<ApiResponse<Account[]>> {
    const accounts = await this.accountsService.findAll(userId);
    return { data: accounts };
  }

  @Post()
  @HttpCode(201)
  async create(
    @Headers('x-user-id') userId: string,
    @Body(new ZodValidationPipe(CreateAccountSchema)) body: CreateAccount,
  ): Promise<ApiResponse<Account>> {
    const account = await this.accountsService.create(userId, body);
    return { data: account };
  }

  @Delete(':id')
  async remove(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ): Promise<ApiResponse<null>> {
    await this.accountsService.remove(userId, id);
    return { data: null };
  }
}
