export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends ApiError {
  constructor(public readonly errors: { field: string; message: string }[]) {
    super(errors.map((e) => `${e.field}: ${e.message}`).join(', '));
  }
}
