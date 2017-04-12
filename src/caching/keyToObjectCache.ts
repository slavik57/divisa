import isNullOrUndefined from "../valueChekers/isNullOrUndefined";
import { CacheCollisionError } from '../errors/errors';
import { CacheInfo } from "./cacheInfo";
import * as sizeof from "object-sizeof";
import { CacheObjectInfo } from "./cacheObjectInfo";

interface CacheObject extends CacheObjectInfo {
  obj: any;
}

export class KeyToObjectCache {
  private keyToObjectMap: Map<string, CacheObject>;
  private totalSizeInBytes: number;

  constructor() {
    this.keyToObjectMap = new Map<string, CacheObject>();
    this.totalSizeInBytes = 0;
  }

  public async add(key: string, obj: any): Promise<void> {
    if (this.keyToObjectMap.has(key)) {
      throw new CacheCollisionError(`An object with key [${key}] already exists`);
    }

    const cacheObject: CacheObject = {
      dateAdded: new Date(),
      obj: obj,
      sizeInBytes: sizeof(obj)
    };

    this.keyToObjectMap.set(key, cacheObject);
    this.totalSizeInBytes += cacheObject.sizeInBytes;
  }

  public async fetch(key: string): Promise<any> {
    const cacheObject: CacheObject = this.keyToObjectMap.get(key);

    if (isNullOrUndefined(cacheObject)) {
      this._throwKeyDoesNotExistError(key);
    }

    return cacheObject.obj;
  }

  public async remove(key: string): Promise<boolean> {
    const cacheObject: CacheObject = this.keyToObjectMap.get(key);
    if (isNullOrUndefined(cacheObject)) {
      return false;
    }

    this.totalSizeInBytes -= cacheObject.sizeInBytes;
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

  public async getObjectInfo(key: string): Promise<CacheObjectInfo> {
    const cacheObject: CacheObject = this.keyToObjectMap.get(key);

    if (isNullOrUndefined(cacheObject)) {
      this._throwKeyDoesNotExistError(key);
    }

    return {
      dateAdded: cacheObject.dateAdded,
      sizeInBytes: cacheObject.sizeInBytes
    }
  }

  private _throwKeyDoesNotExistError(key: string): void {
    throw `The key [${key}] does not exit`;
  }
}