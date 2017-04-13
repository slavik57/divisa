import { KeyToObjectCache, ObjectInfo } from "./keyToObjectCache";
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
import { CacheKey } from "./cacheKey";
import * as uuid from 'uuid';

export class Cache implements CachePartition {
  private _keyToObjectCache: KeyToObjectCache;
  private _keyToCacheKeyMap: Map<string, CacheKey>;
  private _partitions: CachePartition[];
  private _keyToPartitionMap: Map<string, CachePartition>;
  private _keyToPartitionCacheKeyMap: Map<string, CacheKey>;
  private _keyAdded: Subject<CacheKey>;
  private _keyRemoved: Subject<CacheKey>;

  public id: string;

  constructor() {
    this.id = uuid.v4();

    this._keyToObjectCache = new KeyToObjectCache();
    this._keyToCacheKeyMap = new Map<string, CacheKey>();
    this._partitions = [];
    this._keyToPartitionMap = new Map<string, CachePartition>();
    this._keyToPartitionCacheKeyMap = new Map<string, CacheKey>();
    this._keyAdded = new Subject<CacheKey>();
    this._keyRemoved = new Subject<CacheKey>();
  }

  public async add(key: string, object: any, resolver: WithinCacheResolver = WithinCacheResolvers.ThrowErrorResolver): Promise<boolean> {
    try {
      await this._keyToObjectCache.add(key, object);

      const cacheKey = new CacheKey(key, this.id);
      this._keyToCacheKeyMap.set(key, cacheKey);
      this._keyAdded.next(cacheKey);

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
      const cacheKey: CacheKey = this._keyToCacheKeyMap.get(key);
      this._keyToCacheKeyMap.delete(key);

      this._keyRemoved.next(cacheKey);
      return;
    }

    const keyPartition: CachePartition = this._keyToPartitionMap.get(key);
    if (!isNullOrUndefined(keyPartition)) {
      await keyPartition.remove(key);
    }
  }

  public async getKeys(): Promise<CacheKey[]> {
    const result: CacheKey[] = [];

    const localKeys: CacheKey[] = Array.from(this._keyToCacheKeyMap.values());

    const partitionsKeys: CacheKey[] =
      Array.from(this._keyToPartitionCacheKeyMap.values());

    const localKeyIds: string[] = localKeys.map(_ => _.keyId);
    const partitionsKeysWithoutLocalKeys: CacheKey[] =
      partitionsKeys.filter(key => localKeyIds.indexOf(key.keyId) < 0);

    result.push.apply(result, localKeys);
    result.push.apply(result, partitionsKeysWithoutLocalKeys);

    return result;
  }

  public async getInfo(): Promise<CacheInfo> {
    return this._keyToObjectCache.info;
  }

  public async getObjectInfo(key: string): Promise<CacheObjectInfo> {
    try {
      const objectInfo: ObjectInfo = await this._keyToObjectCache.getObjectInfo(key);
      const cacheKey: CacheKey = this._keyToCacheKeyMap.get(key);

      return {
        dateAdded: objectInfo.dateAdded,
        sizeInBytes: objectInfo.sizeInBytes,
        keyId: cacheKey.keyId
      }
    } catch (e) {
      if (e instanceof KeyNotFoundError) {
        return this._getObjectInfoFromPartition(key);
      }
    }
  }

  public async addCachePartition(partition: CachePartition, conflictResolver?: BetweenCachesResolver): Promise<void> {
    if (partition === this) {
      throw `Cannot add self as a partition`;
    }

    if (this._partitions.indexOf(partition) >= 0) {
      return;
    }

    this._partitions.push(partition);
    partition.keyAdded.subscribe(newKey => this._onKeyAddedToPartition(newKey, partition));
    partition.keyRemoved.subscribe(oldKey => this._onKeyRemovedFromPartition(oldKey, partition));
    await this._mapKeysToPartitions(partition);

    await partition.addCachePartition(this, conflictResolver);
  }

  public get keyAdded(): Observable<CacheKey> {
    return this._keyAdded;
  }

  public get keyRemoved(): Observable<CacheKey> {
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
    const cacheKeys: CacheKey[] = await partition.getKeys();

    cacheKeys.forEach(key => {
      this._onKeyAddedToPartition(key, partition);
    });
  }

  private _onKeyAddedToPartition(cacheKey: CacheKey, partition: CachePartition): void {
    if (cacheKey.keyId === this.id) {
      return;
    }

    if (this._keyToPartitionMap.has(cacheKey.key)) {
      return;
    }

    this._keyToPartitionMap.set(cacheKey.key, partition);
    this._keyToPartitionCacheKeyMap.set(cacheKey.key, cacheKey);

    this._keyAdded.next(cacheKey);
  }

  private _onKeyRemovedFromPartition(cacheKey: CacheKey, partition: CachePartition): void {
    if (cacheKey.keyId === this.id) {
      return;
    }

    const partitionForKey = this._keyToPartitionMap.get(cacheKey.key);

    if (isNullOrUndefined(partitionForKey) ||
      partitionForKey !== partition) {
      return;
    }

    this._keyToPartitionMap.delete(cacheKey.key);
    this._keyToPartitionCacheKeyMap.delete(cacheKey.key);

    this._keyRemoved.next(cacheKey);
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

  private async _getObjectInfoFromPartition(key: string): Promise<CacheObjectInfo> {
    const partition = this._keyToPartitionMap.get(key);
    if (isNullOrUndefined(partition)) {
      this._throwNoObjectWithKeyError(key);
    }

    return partition.getObjectInfo(key);
  }
}