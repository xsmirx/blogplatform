export class PostNotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'BlogNotFoundError';
  }
}
