export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(
    public entity: string,
    public id?: string | number,
  ) {
    super(`${entity}${id ? ` with id ${id}` : ''} not found`);
  }
}
export class ForbiddenError extends DomainError {}
export class UnauthorizedError extends DomainError {}
export class WrongCredentialsError extends DomainError {
  constructor() {
    super('Wrong credentials provided');
  }
}
export class UniqueConstraintError<
  T extends Record<string, string>,
> extends DomainError {
  constructor(
    public paramKey: keyof T & string,
    public value: string,
  ) {
    super(`${paramKey} should be unique`);
  }
}
export class DomainValidationError<
  T extends Record<string, string>,
> extends DomainError {
  constructor(
    public paramKey: keyof T,
    public value: unknown,
    message: string,
  ) {
    super(message);
  }
}
