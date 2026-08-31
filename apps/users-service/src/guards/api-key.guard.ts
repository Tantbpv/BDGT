import { createApiKeyGuard } from '@repo/nestjs-shared';

export const ApiKeyGuard = createApiKeyGuard('USERS_SERVICE_KEY');
