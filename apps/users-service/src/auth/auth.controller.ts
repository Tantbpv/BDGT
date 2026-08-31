import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type {
  AuthTokensResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '@repo/contracts/auth';
import {
  ChangePasswordRequestSchema,
  ForgotPasswordRequestSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  ResetPasswordRequestSchema,
} from '@repo/contracts/auth';
import type { ApiResponse } from '@repo/contracts/common';
import { LoggingInterceptor , ZodValidationPipe } from '@repo/nestjs-shared';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { AuthService } from './auth.service';

@Controller('auth')
@UseGuards(ApiKeyGuard)
@UseInterceptors(LoggingInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(LoginRequestSchema)) body: LoginRequest,
  ): Promise<ApiResponse<AuthTokensResponse>> {
    const result = await this.authService.login(body);
    return { data: result };
  }

  @Post('register')
  @HttpCode(201)
  async register(
    @Body(new ZodValidationPipe(RegisterRequestSchema)) body: RegisterRequest,
  ): Promise<ApiResponse<AuthTokensResponse>> {
    const result = await this.authService.register(body);
    return { data: result };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Body() body: { refreshToken?: string },
  ): Promise<ApiResponse<null>> {
    await this.authService.logout(body.refreshToken ?? '');
    return { data: null };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body() body: { refreshToken?: string },
  ): Promise<ApiResponse<AuthTokensResponse>> {
    const result = await this.authService.refresh(body.refreshToken ?? '');
    return { data: result };
  }

  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @Headers('x-user-id') userId: string,
    @Body(new ZodValidationPipe(ChangePasswordRequestSchema)) body: ChangePasswordRequest,
  ): Promise<ApiResponse<null>> {
    await this.authService.changePassword(userId, body);
    return { data: null };
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordRequestSchema)) body: ForgotPasswordRequest,
  ): Promise<ApiResponse<{ token?: string }>> {
    const result = await this.authService.forgotPassword(body);
    return { data: result };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordRequestSchema)) body: ResetPasswordRequest,
  ): Promise<ApiResponse<null>> {
    await this.authService.resetPassword(body);
    return { data: null };
  }
}
