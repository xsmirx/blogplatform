export class BlogNotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'BlogNotFoundError';
  }
}
