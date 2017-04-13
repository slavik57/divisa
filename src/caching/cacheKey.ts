import * as uuid from 'uuid';

export class CacheKey {
  public keyId: string;

  constructor(public key: string) {
    this.keyId = uuid.v4();
  }
}