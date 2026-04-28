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
export class ValidationError extends DomainError {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
  }
}
