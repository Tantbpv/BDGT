import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { EnvConfig } from '../config/env.schema';
import { LLM_PROVIDER } from './llm.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OllamaProvider } from './providers/ollama.provider';

@Module({
  providers: [
    {
      provide: LLM_PROVIDER,
      useFactory: (config: ConfigService<EnvConfig, true>) => {
        const provider = config.get('LLM_PROVIDER');
        return provider === 'anthropic'
          ? new AnthropicProvider(config)
          : new OllamaProvider(config);
      },
      inject: [ConfigService],
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
