import isNullOrUndefined from "../valueChekers/isNullOrUndefined";
import { CacheCollisionError } from '../errors/errors';

export class KeyToObjectCache {
  private keyToObjectMap: Map<string, any>;

  constructor() {
    this.keyToObjectMap = new Map<string, object>();
  }

  public async add(key: string, obj: any): Promise<void> {
    if (this.keyToObjectMap.has(key)) {
      throw new CacheCollisionError(`An object with key [${key}] already exists`);
    }

    this.keyToObjectMap.set(key, obj);
  }

  public async fetch(key: string): Promise<any> {
    const obj = this.keyToObjectMap.get(key);

    if (isNullOrUndefined(obj)) {
      throw `The key ${key} does not exit`;
    }

    return obj;
  }

  public async remove(key: string): Promise<boolean> {
    return this.keyToObjectMap.delete(key);
  }

  public get keys(): Promise<string[]> {
    return Promise.resolve(Array.from(this.keyToObjectMap.keys()));
  }

  public get size(): Promise<number> {
    return Promise.resolve(this.keyToObjectMap.size);
  }
}