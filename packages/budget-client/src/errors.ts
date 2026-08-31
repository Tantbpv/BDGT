export class BudgetClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'BudgetClientError';
    Object.setPrototypeOf(this, BudgetClientError.prototype);
  }
}
