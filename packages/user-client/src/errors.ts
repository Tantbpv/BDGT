export class UserClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'UserClientError';
    Object.setPrototypeOf(this, UserClientError.prototype);
  }
}
