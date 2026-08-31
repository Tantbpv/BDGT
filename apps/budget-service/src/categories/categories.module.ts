import { Module } from '@nestjs/common';

import { UserSettingModule } from '../user-setting/user-setting.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [UserSettingModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
