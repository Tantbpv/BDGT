export class AIClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AIClientError';
    Object.setPrototypeOf(this, AIClientError.prototype);
  }
}
