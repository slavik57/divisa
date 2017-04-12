export class KeyNotFoundError extends Error {
  constructor(public key: string, message?: string) {
    super(message);
  }
}