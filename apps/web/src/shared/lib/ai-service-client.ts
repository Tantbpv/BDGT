import { AIClient } from '@repo/ai-client';

export const aiServiceClient = new AIClient({
  baseUrl: process.env['AI_SERVICE_URL'] ?? 'http://localhost:3001',
  apiKey: process.env['AI_SERVICE_KEY'] ?? '',
});
