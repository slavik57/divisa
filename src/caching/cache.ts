import { KeyToObjectCache } from "./keyToObjectCache";
import { isNullOrUndefined } from "../valueChekers/valueCheckers";
import { CacheKey } from "./cacheKey";
import { Resolver } from "../resolvers/resolver";
import { CacheCollisionError } from "../errors/errors";
import { Resolvers } from "../resolvers/resolvers";
import { CachePartition } from "./cachePartition";
import { NO_TYPE } from "./noType";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { CacheInfo } from "./cacheInfo";

export class Cache implements CachePartition {
  private typeToCacheMap: Map<symbol | string, KeyToObjectCache>;
  private keyAddedObservable: Subject<CacheKey>;
  private keyRemovedObservable: Subject<CacheKey>;

  constructor() {
    this.typeToCacheMap = new Map<symbol | string, KeyToObjectCache>();
    this.keyAddedObservable = new Subject<CacheKey>();
    this.keyRemovedObservable = new Subject<CacheKey>();
  }

  public async add(key: CacheKey, object: any, resolver: Resolver = Resolvers.ThrowErrorResolver): Promise<boolean> {
    try {
      await this._addToTypeSpecificCache(key, object);

      this.keyAddedObservable.next(key);

      return true;
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
    if (isNullOrUndefined(typeCache)) {
      return;
    }

    if (await typeCache.remove(key.key)) {
      this.keyRemovedObservable.next(key);
    }
  }

  public async getKeysByTypes(): Promise<Map<symbol | string, string[]>> {
    const result = new Map<symbol | string, string[]>();

    for (let tuple of this.typeToCacheMap.entries()) {
      const type: symbol | string = tuple[0];
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
      Array.from(this.typeToCacheMap.values());

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

  public get keyAdded(): Observable<CacheKey> {
    return this.keyAddedObservable;
  }

  public get keyRemoved(): Observable<CacheKey> {
    return this.keyRemovedObservable;
  }

  private _getType(key: CacheKey): symbol | string {
    if (isNullOrUndefined(key.type)) {
      return NO_TYPE;
    }

    return key.type;
  }

  private async _addToTypeSpecificCache(key: CacheKey, object: any): Promise<void> {
    const type: symbol | string = this._getType(key);

    const cache: KeyToObjectCache =
      this.typeToCacheMap.get(type) || new KeyToObjectCache();
    this.typeToCacheMap.set(type, cache);

    await cache.add(key.key, object);
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