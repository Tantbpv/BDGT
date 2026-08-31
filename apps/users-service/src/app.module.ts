import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@repo/nestjs-shared';
import { LoggerModule } from 'nestjs-pino';

import { AuthModule } from './auth/auth.module';
import { envSchema } from './config/env.schema';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';

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
    HealthModule,
    AuthModule,
    UserModule,
  ],
})
export class AppModule {}
