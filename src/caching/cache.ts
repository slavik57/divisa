import { KeyToObjectCache } from "./keyToObjectCache";
import { isNullOrUndefined } from "../valueChekers/valueCheckers";
import { CacheKey } from "./cacheKey";
import { Resolver } from "../resolvers/resolver";
import { CacheCollisionError } from "../errors/errors";
import { Resolvers } from "../resolvers/resolvers";
import { CachePartition } from "./cachePartition";
import { NO_TYPE } from './noType';

export class Cache implements CachePartition {
  private defaultCache: KeyToObjectCache;
  private typeToCacheMap: Map<string, KeyToObjectCache>;

  constructor() {
    this.defaultCache = new KeyToObjectCache();
    this.typeToCacheMap = new Map<string, KeyToObjectCache>();
  }

  public add(key: CacheKey, object: any, resolver: Resolver = Resolvers.ThrowErrorResolver): boolean {
    try {
      this._addToTypeSpecificCache(key, object);
      return true;
    } catch (e) {
      return this._handleErrorOnAddingToCache(e, key, object, resolver);
    }
  }

  public fetch(key: CacheKey): Promise<any> {
    if (isNullOrUndefined(key.type)) {
      return this.defaultCache.fetch(key.key);
    }

    const typeCache: KeyToObjectCache = this.typeToCacheMap[key.type];
    if (!isNullOrUndefined(typeCache)) {
      return typeCache.fetch(key.key);
    } else {
      return Promise.reject(`There is no object registered for key [${key}]`)
    }
  }

  public remove(key: CacheKey): void {
    if (isNullOrUndefined(key.type)) {
      this.defaultCache.remove(key.key);
      return;
    }

    const typeCache: KeyToObjectCache = this.typeToCacheMap[key.type];
    if (!isNullOrUndefined(typeCache)) {
      typeCache.remove(key.key);
    }
  }

  public getKeysByTypes(): Map<symbol | string, string[]> {
    const result = new Map<symbol | string, string[]>();

    if (this.defaultCache.size > 0) {
      result.set(NO_TYPE, this.defaultCache.keys);
    }

    return result;
  }

  private _addToTypeSpecificCache(key: CacheKey, object: any): void {
    if (isNullOrUndefined(key.type)) {
      this.defaultCache.add(key.key, object);
      return;
    }

    const cache: KeyToObjectCache =
      this.typeToCacheMap[key.type] || new KeyToObjectCache();
    this.typeToCacheMap[key.type] = cache;

    cache.add(key.key, object);
  }

  private _handleErrorOnAddingToCache(
    error: CacheCollisionError,
    key: CacheKey,
    object: any,
    resolver: Resolver): boolean {
    if (error instanceof CacheCollisionError && !!resolver) {
      return resolver.resolve(this, key, object);
    } else {
      throw error;
    }
  }
}