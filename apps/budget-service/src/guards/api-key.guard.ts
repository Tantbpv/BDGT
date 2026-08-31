import { createApiKeyGuard } from '@repo/nestjs-shared';

export const ApiKeyGuard = createApiKeyGuard('BUDGET_SERVICE_KEY');
