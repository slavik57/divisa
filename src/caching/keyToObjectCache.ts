import isNullOrUndefined from "../valueChekers/isNullOrUndefined";
import { CacheCollisionError } from '../errors/errors';
import { CacheInfo } from "./cacheInfo";
import * as sizeof from "object-sizeof";

export class KeyToObjectCache {
  private keyToObjectMap: Map<string, any>;
  private totalSizeInBytes: number;

  constructor() {
    this.keyToObjectMap = new Map<string, object>();
    this.totalSizeInBytes = 0;
  }

  public async add(key: string, obj: any): Promise<void> {
    if (this.keyToObjectMap.has(key)) {
      throw new CacheCollisionError(`An object with key [${key}] already exists`);
    }

    this.keyToObjectMap.set(key, obj);
    this.totalSizeInBytes += sizeof(obj);
  }

  public async fetch(key: string): Promise<any> {
    const obj = this.keyToObjectMap.get(key);

    if (isNullOrUndefined(obj)) {
      throw `The key ${key} does not exit`;
    }

    return obj;
  }

  public async remove(key: string): Promise<boolean> {
    const obj = this.keyToObjectMap.get(key);
    if (isNullOrUndefined(obj)) {
      return false;
    }

    this.totalSizeInBytes -= sizeof(obj);
    return this.keyToObjectMap.delete(key);
  }

  public get keys(): Promise<string[]> {
    return Promise.resolve(Array.from(this.keyToObjectMap.keys()));
  }

  public get info(): Promise<CacheInfo> {
    return Promise.resolve(<CacheInfo>{
      numberOfObjects: this.keyToObjectMap.size,
      sizeInBytes: this.totalSizeInBytes
    });
  }
}