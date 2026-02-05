export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class WrongCredentialsError extends Error {
  constructor() {
    super('Wrong credentials provided');
    this.name = 'WrongCredentialsError';
  }
}
