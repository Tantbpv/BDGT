import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { UpdateUser, UpdateUserSetting, User, UserSetting } from '@repo/contracts/users';
import { UpdateUserSchema, UpdateUserSettingSchema } from '@repo/contracts/users';
import type { ApiResponse } from '@repo/contracts/common';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(ApiKeyGuard)
@UseInterceptors(LoggingInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(
    @Headers('x-user-id') userId: string,
  ): Promise<ApiResponse<User>> {
    const user = await this.userService.getMe(userId);
    return { data: user };
  }

  @Patch('me')
  @HttpCode(200)
  async updateMe(
    @Headers('x-user-id') userId: string,
    @Body(new ZodValidationPipe(UpdateUserSchema)) body: UpdateUser,
  ): Promise<ApiResponse<User>> {
    const user = await this.userService.updateMe(userId, body);
    return { data: user };
  }

  @Get('me/settings')
  async getSettings(
    @Headers('x-user-id') userId: string,
  ): Promise<ApiResponse<UserSetting>> {
    const settings = await this.userService.getSettings(userId);
    return { data: settings };
  }

  @Patch('me/settings')
  @HttpCode(200)
  async updateSettings(
    @Headers('x-user-id') userId: string,
    @Body(new ZodValidationPipe(UpdateUserSettingSchema)) body: UpdateUserSetting,
  ): Promise<ApiResponse<UserSetting>> {
    const settings = await this.userService.updateSettings(userId, body);
    return { data: settings };
  }
}
