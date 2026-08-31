import { Module } from '@nestjs/common';

import { UserSettingModule } from '../user-setting/user-setting.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [UserSettingModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
