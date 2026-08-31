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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  type Category,
  type CreateCategory,
  CreateCategorySchema,
  type UpdateCategory,
  UpdateCategorySchema,
} from '@repo/contracts/categories';
import type { ApiResponse } from '@repo/contracts/common';
import { LoggingInterceptor , ZodValidationPipe } from '@repo/nestjs-shared';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { CategoriesService } from './categories.service';

@Controller('categories')
@UseGuards(ApiKeyGuard)
@UseInterceptors(LoggingInterceptor)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Headers('x-user-id') userId: string): Promise<ApiResponse<Category[]>> {
    const categories = await this.categoriesService.findAll(userId);
    return { data: categories };
  }

  @Post()
  @HttpCode(201)
  async create(
    @Headers('x-user-id') userId: string,
    @Body(new ZodValidationPipe(CreateCategorySchema)) body: CreateCategory,
  ): Promise<ApiResponse<Category>> {
    const category = await this.categoriesService.create(userId, body);
    return { data: category };
  }

  @Get(':id')
  async findOne(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ): Promise<ApiResponse<Category>> {
    const category = await this.categoriesService.findOne(userId, id);
    return { data: category };
  }

  @Put(':id')
  async update(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCategorySchema)) body: UpdateCategory,
  ): Promise<ApiResponse<Category>> {
    const category = await this.categoriesService.update(userId, id, body);
    return { data: category };
  }

  @Delete(':id')
  async remove(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ): Promise<ApiResponse<null>> {
    await this.categoriesService.remove(userId, id);
    return { data: null };
  }
}
