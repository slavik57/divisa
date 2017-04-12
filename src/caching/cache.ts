import { KeyToObjectCache } from "./keyToObjectCache";
import { isNullOrUndefined } from "../valueChekers/valueCheckers";
import { WithinCacheResolver } from "../resolvers/withinCache/withinCacheResolver";
import { BetweenCachesResolver } from "../resolvers/betweenCaches/betweenCachesResolver";
import { WithinCacheResolvers } from "../resolvers/withinCache/withinCacheResolvers";
import { CacheCollisionError, KeyNotFoundError } from "../errors/errors";
import { CachePartition } from "./cachePartition";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { CacheInfo } from "./cacheInfo";
import { CacheObjectInfo } from "./cacheObjectInfo";

export class Cache implements CachePartition {
  private _keyToObjectCache: KeyToObjectCache;
  private _partitions: CachePartition[];
  private _keyToPartitionMap: Map<string, CachePartition>;
  private _keyAdded: Subject<string>;
  private _keyRemoved: Subject<string>;

  constructor() {
    this._keyToObjectCache = new KeyToObjectCache();
    this._partitions = [];
    this._keyToPartitionMap = new Map<string, CachePartition>();
    this._keyAdded = new Subject<string>();
    this._keyRemoved = new Subject<string>();
  }

  public async add(key: string, object: any, resolver: WithinCacheResolver = WithinCacheResolvers.ThrowErrorResolver): Promise<boolean> {
    try {
      await this._keyToObjectCache.add(key, object);

      this._keyAdded.next(key);

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
      return this._fetchFromPartition(key, partition);
    }

    this._throwNoObjectWithKeyError(key);
  }

  public async remove(key: string): Promise<void> {
    if (await this._keyToObjectCache.remove(key)) {
      this._keyRemoved.next(key);
    }
  }

  public async getKeys(): Promise<string[]> {
    const result: string[] = [];

    const localKeys: string[] = await this._keyToObjectCache.keys;
    const partitionsKeys: string[] =
      Array.from(this._keyToPartitionMap.keys());

    result.push.apply(result, localKeys);
    result.push.apply(result, partitionsKeys);

    return result;
  }

  public async getInfo(): Promise<CacheInfo> {
    return this._keyToObjectCache.info;
  }

  public async getObjectInfo(key: string): Promise<CacheObjectInfo> {
    return this._keyToObjectCache.getObjectInfo(key);
  }

  public async addCachePartition(partition: CachePartition, conflictResolver?: BetweenCachesResolver): Promise<void> {
    if (partition === this) {
      throw `Cannot add self as a partition`;
    }

    if (this._partitions.indexOf(partition) >= 0) {
      throw 'The partition already exists';
    }

    this._partitions.push(partition);
    partition.keyAdded.subscribe(newKey => this._onKeyAddedToPartition(newKey, partition));
    partition.keyRemoved.subscribe(oldKey => this._onKeyRemovedFromPartition(oldKey, partition));
    await this._mapKeysToPartitions(partition);
  }

  public get keyAdded(): Observable<string> {
    return this._keyAdded;
  }

  public get keyRemoved(): Observable<string> {
    return this._keyRemoved;
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
    throw new KeyNotFoundError(key);
  }

  private async _mapKeysToPartitions(partition: CachePartition): Promise<void> {
    const keys: string[] = await partition.getKeys();

    keys.forEach(key => {
      this._onKeyAddedToPartition(key, partition);
    });
  }

  private _onKeyAddedToPartition(key: string, partition: CachePartition): void {
    if (this._keyToPartitionMap.has(key)) {
      return;
    }

    this._keyToPartitionMap.set(key, partition);

    this._keyAdded.next(key);
  }

  private _onKeyRemovedFromPartition(key: string, partition: CachePartition): void {
    const partitionForKey = this._keyToPartitionMap.get(key);

    if (isNullOrUndefined(partitionForKey) ||
      partitionForKey !== partition) {
      return;
    }

    this._keyToPartitionMap.delete(key);

    this._keyRemoved.next(key);
  }

  private async _fetchFromPartition(key: string, partition: CachePartition): Promise<void> {
    try {
      return await partition.fetch(key);
    } catch (e) {
      this._handleFetchFromPartitionFailed(e, key, partition);
    }
  }

  private _handleFetchFromPartitionFailed(error: any, key: string, partition: CachePartition): void {
    if (error instanceof KeyNotFoundError &&
      this._keyToPartitionMap.get(key) === partition) {
      this._keyToPartitionMap.delete(key);
    }

    throw error;
  }
}