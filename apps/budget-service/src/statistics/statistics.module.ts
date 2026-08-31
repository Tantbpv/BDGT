import { Module } from '@nestjs/common';

import { UserSettingModule } from '../user-setting/user-setting.module';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [UserSettingModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
