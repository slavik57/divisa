import { KeyToObjectCache } from "./keyToObjectCache";
import { isNullOrUndefined } from "../valueChekers/valueCheckers";
import { WithinCacheResolver } from "../resolvers/withinCache/withinCacheResolver";
import { BetweenCachesResolver } from "../resolvers/betweenCaches/betweenCachesResolver";
import { WithinCacheResolvers } from "../resolvers/withinCache/withinCacheResolvers";
import { CacheCollisionError } from "../errors/errors";
import { CachePartition } from "./cachePartition";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { CacheInfo } from "./cacheInfo";
import { CacheObjectInfo } from "./cacheObjectInfo";

export class Cache implements CachePartition {
  private _keyToObjectCache: KeyToObjectCache;
  private _partitions: CachePartition[];
  private _keyToPartitionMap: Map<string, CachePartition>;
  private _keyAddedObservable: Subject<string>;
  private _keyRemovedObservable: Subject<string>;

  constructor() {
    this._keyToObjectCache = new KeyToObjectCache();
    this._partitions = [];
    this._keyToPartitionMap = new Map<string, CachePartition>();
    this._keyAddedObservable = new Subject<string>();
    this._keyRemovedObservable = new Subject<string>();
  }

  public async add(key: string, object: any, resolver: WithinCacheResolver = WithinCacheResolvers.ThrowErrorResolver): Promise<boolean> {
    try {
      await this._keyToObjectCache.add(key, object);

      this._keyAddedObservable.next(key);

      return true;
    } catch (e) {
      return this._handleErrorOnAddingToCache(e, key, object, resolver);
    }
  }

  public async fetch(key: string): Promise<any> {
    try {
      return await this._keyToObjectCache.fetch(key);
    } catch (e) {
    }

    const partition: CachePartition = this._keyToPartitionMap.get(key);
    if (!isNullOrUndefined(partition)) {
      return partition.fetch(key);
    }

    this._throwNoObjectWithKeyError(key);
  }

  public async remove(key: string): Promise<void> {
    if (await this._keyToObjectCache.remove(key)) {
      this._keyRemovedObservable.next(key);
    }
  }

  public async getKeys(): Promise<string[]> {
    const result: string[] = [];

    const localKeys: string[] = await this._keyToObjectCache.keys;

    result.push.apply(result, localKeys);

    return result;
  }

  public async getInfo(): Promise<CacheInfo> {
    return this._keyToObjectCache.info;
  }

  public async getObjectInfo(key: string): Promise<CacheObjectInfo> {
    return this._keyToObjectCache.getObjectInfo(key);
  }

  public async addCachePartition(partition: CachePartition, conflictResolver: BetweenCachesResolver): Promise<void> {
    if (partition === this) {
      throw `Cannot add self as a partition`;
    }

    if (this._partitions.indexOf(partition) >= 0) {
      throw 'The partition already exists';
    }

    this._partitions.push(partition);
    await this._mapKeysToPartitions(partition);
  }

  public get keyAdded(): Observable<string> {
    return this._keyAddedObservable;
  }

  public get keyRemoved(): Observable<string> {
    return this._keyRemovedObservable;
  }

  private async _handleErrorOnAddingToCache(
    error: CacheCollisionError,
    key: string,
    object: any,
    resolver: WithinCacheResolver): Promise<boolean> {
    if (error instanceof CacheCollisionError && !!resolver) {
      return await resolver.resolve(this, key, object);
    } else {
      throw error;
    }
  }

  private _throwNoObjectWithKeyError(key: string): void {
    throw `There is no object registered for key [${key}]`;
  }

  private async _mapKeysToPartitions(partition: CachePartition): Promise<void> {
    const keys: string[] = await partition.getKeys();

    keys.forEach(key => {
      this._keyToPartitionMap.set(key, partition);
    });
  }
}