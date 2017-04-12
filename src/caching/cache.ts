import { KeyToObjectCache } from "./keyToObjectCache";
import { isNullOrUndefined } from "../valueChekers/valueCheckers";
import { CacheKey } from "./cacheKey";
import { WithinCacheResolver } from "../resolvers/withinCache/withinCacheResolver";
import { BetweenCachesResolver } from "../resolvers/betweenCaches/betweenCachesResolver";
import { WithinCacheResolvers } from "../resolvers/withinCache/withinCacheResolvers";
import { CacheCollisionError } from "../errors/errors";
import { CachePartition } from "./cachePartition";
import { NO_TYPE } from "./noType";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { CacheInfo } from "./cacheInfo";
import { CacheObjectInfo } from "./cacheObjectInfo";

export type ObjectType = string | symbol;

export class Cache implements CachePartition {
  private _typeToCacheMap: Map<ObjectType, KeyToObjectCache>;
  private _typeToPartitionMap: Map<ObjectType, CachePartition>;
  private _keyAddedObservable: Subject<CacheKey>;
  private _keyRemovedObservable: Subject<CacheKey>;

  constructor() {
    this._typeToCacheMap = new Map<ObjectType, KeyToObjectCache>();
    this._typeToPartitionMap = new Map<ObjectType, CachePartition>();
    this._keyAddedObservable = new Subject<CacheKey>();
    this._keyRemovedObservable = new Subject<CacheKey>();
  }

  public async add(key: CacheKey, object: any, resolver: WithinCacheResolver = WithinCacheResolvers.ThrowErrorResolver): Promise<boolean> {
    try {
      await this._addToTypeSpecificCache(key, object);

      this._keyAddedObservable.next(key);

      return true;
    } catch (e) {
      return this._handleErrorOnAddingToCache(e, key, object, resolver);
    }
  }

  public async fetch(key: CacheKey): Promise<any> {
    const type: ObjectType = this._getType(key.type);

    const typeCache: KeyToObjectCache = this._typeToCacheMap.get(type);
    if (!isNullOrUndefined(typeCache)) {
      return typeCache.fetch(key.key);
    }

    const typePartition: CachePartition = this._typeToPartitionMap.get(type);
    if (!isNullOrUndefined(typePartition)) {
      return typePartition.fetch(key);
    }

    this._throwNoObjectWithKeyError(key);
  }

  public async remove(key: CacheKey): Promise<void> {
    const type: ObjectType = this._getType(key.type);

    const typeCache: KeyToObjectCache = this._typeToCacheMap.get(type);
    if (isNullOrUndefined(typeCache)) {
      return;
    }

    if (await typeCache.remove(key.key)) {
      this._keyRemovedObservable.next(key);
    }
  }

  public async getKeysByTypes(): Promise<Map<ObjectType, string[]>> {
    const result = new Map<ObjectType, string[]>();

    for (let tuple of this._typeToCacheMap.entries()) {
      const type: ObjectType = tuple[0];
      const keyToObjectCache: KeyToObjectCache = tuple[1];

      const keysOfType: string[] = result.get(type) || [];
      result.set(type, keysOfType);

      const keys: string[] = await keyToObjectCache.keys;

      keysOfType.push.apply(keysOfType, keys);
    }

    return result;
  }

  public async getInfo(): Promise<CacheInfo> {
    const caches: KeyToObjectCache[] =
      Array.from(this._typeToCacheMap.values());

    const infos: CacheInfo[] =
      await Promise.all(caches.map(_ => _.info));

    return infos.reduce((prev: CacheInfo, curr: CacheInfo) =>
      ({
        numberOfObjects: prev.numberOfObjects + curr.numberOfObjects,
        sizeInBytes: prev.sizeInBytes + curr.sizeInBytes
      }),
      {
        numberOfObjects: 0,
        sizeInBytes: 0
      }
    );
  }

  public async getObjectInfo(key: CacheKey): Promise<CacheObjectInfo> {
    const type: ObjectType = this._getType(key.type);

    const typeCache: KeyToObjectCache = this._typeToCacheMap.get(type);
    if (isNullOrUndefined(typeCache)) {
      this._throwNoObjectWithKeyError(key);
    }

    return typeCache.getObjectInfo(key.key);
  }

  public addCachePartition(partition: CachePartition, conflictResolver: BetweenCachesResolver, forType?: string): void {
    if (partition === this) {
      throw `Cannot add self as a partition`;
    }

    const type: ObjectType = this._getType(forType);

    if (this._typeToPartitionMap.has(type)) {
      throw `A partition for the type [${type}] already exists`;
    }

    this._typeToPartitionMap.set(type, partition);
  }

  public get keyAdded(): Observable<CacheKey> {
    return this._keyAddedObservable;
  }

  public get keyRemoved(): Observable<CacheKey> {
    return this._keyRemovedObservable;
  }

  private _getType(type: string): ObjectType {
    if (isNullOrUndefined(type)) {
      return NO_TYPE;
    }

    return type;
  }

  private async _addToTypeSpecificCache(key: CacheKey, object: any): Promise<void> {
    const type: ObjectType = this._getType(key.type);

    const cache: KeyToObjectCache =
      this._typeToCacheMap.get(type) || new KeyToObjectCache();
    this._typeToCacheMap.set(type, cache);

    await cache.add(key.key, object);
  }

  private async _handleErrorOnAddingToCache(
    error: CacheCollisionError,
    key: CacheKey,
    object: any,
    resolver: WithinCacheResolver): Promise<boolean> {
    if (error instanceof CacheCollisionError && !!resolver) {
      return await resolver.resolve(this, key, object);
    } else {
      throw error;
    }
  }

  private _throwNoObjectWithKeyError(key: CacheKey): void {
    throw `There is no object registered for key [${key}]`;
  }
}