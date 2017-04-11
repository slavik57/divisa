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

  public add(key: CacheKey, object: any, resolver: Resolver = Resolvers.ThrowErrorResolver): Promise<boolean> {
    return this._addToTypeSpecificCache(key, object)
      .catch(e => this._handleErrorOnAddingToCache(e, key, object, resolver));
  }

  public fetch(key: CacheKey): Promise<any> {
    const type: symbol | string = this._getType(key);

    const typeCache: KeyToObjectCache = this.typeToCacheMap.get(type);
    if (!isNullOrUndefined(typeCache)) {
      return typeCache.fetch(key.key);
    } else {
      return Promise.reject(`There is no object registered for key [${key}]`)
    }
  }

  public remove(key: CacheKey): void {
    const type: symbol | string = this._getType(key);

    const typeCache: KeyToObjectCache = this.typeToCacheMap.get(type);
    if (!isNullOrUndefined(typeCache)) {
      typeCache.remove(key.key);
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

  private _addToTypeSpecificCache(key: CacheKey, object: any): Promise<boolean> {
    const type: symbol | string = this._getType(key);

    const cache: KeyToObjectCache =
      this.typeToCacheMap.get(type) || new KeyToObjectCache();
    this.typeToCacheMap.set(type, cache);

    return cache.add(key.key, object).then(() => true);
  }

  private _handleErrorOnAddingToCache(
    error: CacheCollisionError,
    key: CacheKey,
    object: any,
    resolver: Resolver): Promise<boolean> {
    if (error instanceof CacheCollisionError && !!resolver) {
      return resolver.resolve(this, key, object);
    } else {
      return Promise.reject(error);
    }
  }
}