import isNullOrUndefined from "../valueChekers/isNullOrUndefined";
import { CacheCollisionError } from '../errors/errors';

export class KeyToObjectCache {
  private keyToObjectMap: Map<string, any>;

  constructor() {
    this.keyToObjectMap = new Map<string, object>();
  }

  public add(key: string, obj: any) {
    if (this.keyToObjectMap.has(key)) {
      throw new CacheCollisionError(`An object with key [${key}] already exists`);
    }
    this.keyToObjectMap.set(key, obj);
  }

  public fetch(key: string): Promise<any> {
    const obj = this.keyToObjectMap.get(key);

    if (isNullOrUndefined(obj)) {
      return Promise.reject(`The key ${key} does not exit`);
    }

    return Promise.resolve(obj);
  }

  public remove(key: string): void {
    this.keyToObjectMap.delete(key);
  }

  public get keys(): string[] {
    return Array.from(this.keyToObjectMap.keys());
  }

  public get size(): number {
    return this.keyToObjectMap.size;
  }
}