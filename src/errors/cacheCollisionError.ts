export class CacheCollisionError extends Error {
  constructor(message?: string) {
    super(message);
  }
}