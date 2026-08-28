import { UserClient } from '@repo/user-client';

export const usersServiceClient = new UserClient({
  baseUrl: process.env['USERS_SERVICE_URL'] ?? 'http://localhost:3002',
  serviceKey: process.env['USERS_SERVICE_KEY'] ?? '',
});
