import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { ChatModule } from './chat/chat.module';
import { ConversationModule } from './conversation/conversation.module';
import { envSchema } from './config/env.schema';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const result = envSchema.safeParse(config);
        if (!result.success) {
          throw new Error(`Config validation failed: ${result.error.message}`);
        }
        return result.data;
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env['LOG_LEVEL'] ?? 'info',
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
      },
    }),
    DatabaseModule,
    ChatModule,
    ConversationModule,
    HealthModule,
  ],
})
export class AppModule {}
