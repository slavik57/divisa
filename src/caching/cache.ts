import { KeyToObjectCache } from "./keyToObjectCache";
import { isNullOrUndefined } from "../valueChekers/valueCheckers";
import { CacheKey } from "./cacheKey";
import { Resolver } from "../resolvers/resolver";
import { CacheCollisionError } from "../errors/errors";
import { Resolvers } from "../resolvers/resolvers";
import { CachePartition } from "./cachePartition";
import { NO_TYPE } from './noType';

export class Cache implements CachePartition {
  private typeToCacheMap: Map<symbol | string, KeyToObjectCache>;

  constructor() {
    this.typeToCacheMap = new Map<symbol | string, KeyToObjectCache>();
  }

  public async add(key: CacheKey, object: any, resolver: Resolver = Resolvers.ThrowErrorResolver): Promise<boolean> {
    try {
      return await this._addToTypeSpecificCache(key, object);
    } catch (e) {
      return this._handleErrorOnAddingToCache(e, key, object, resolver);
    }
  }

  public async fetch(key: CacheKey): Promise<any> {
    const type: symbol | string = this._getType(key);

    const typeCache: KeyToObjectCache = this.typeToCacheMap.get(type);
    if (!isNullOrUndefined(typeCache)) {
      return typeCache.fetch(key.key);
    } else {
      throw `There is no object registered for key [${key}]`;
    }
  }

  public async remove(key: CacheKey): Promise<void> {
    const type: symbol | string = this._getType(key);

    const typeCache: KeyToObjectCache = this.typeToCacheMap.get(type);
    if (!isNullOrUndefined(typeCache)) {
      return typeCache.remove(key.key);
    }
  }

  public getKeysByTypes(): Map<symbol | string, string[]> {
    const result = new Map<symbol | string, string[]>();

    for (let tuple of this.typeToCacheMap.entries()) {
      const type: symbol | string = tuple[0];
      const keyToObjectCache: KeyToObjectCache = tuple[1];

      const keysOfType: string[] = result.get(type) || [];
      result.set(type, keysOfType);

      keysOfType.push.apply(keysOfType, keyToObjectCache.keys);
    }

    return result;
  }

  private _getType(key: CacheKey): symbol | string {
    if (isNullOrUndefined(key.type)) {
      return NO_TYPE;
    }

    return key.type;
  }

  private async _addToTypeSpecificCache(key: CacheKey, object: any): Promise<boolean> {
    const type: symbol | string = this._getType(key);

    const cache: KeyToObjectCache =
      this.typeToCacheMap.get(type) || new KeyToObjectCache();
    this.typeToCacheMap.set(type, cache);

    await cache.add(key.key, object);
    return true;
  }

  private async _handleErrorOnAddingToCache(
    error: CacheCollisionError,
    key: CacheKey,
    object: any,
    resolver: Resolver): Promise<boolean> {
    if (error instanceof CacheCollisionError && !!resolver) {
      return await resolver.resolve(this, key, object);
    } else {
      throw error;
    }
  }
}