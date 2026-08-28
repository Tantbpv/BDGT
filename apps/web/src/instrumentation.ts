import { Agent, setGlobalDispatcher } from 'undici';

export function register(): void {
  setGlobalDispatcher(new Agent({ headersTimeout: 10 * 60 * 1000, bodyTimeout: 10 * 60 * 1000 }));
}
