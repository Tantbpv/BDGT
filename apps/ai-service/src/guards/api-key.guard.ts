import { createApiKeyGuard } from '@repo/nestjs-shared';

export const ApiKeyGuard = createApiKeyGuard('AI_SERVICE_KEY');
