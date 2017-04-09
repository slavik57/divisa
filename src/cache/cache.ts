import { KeyToObjectCache } from "./keyToObjectCache";
import { isNullOrUndefined } from "../valueChekers/valueCheckers";
import { CacheKey } from "./cacheKey";

export class Cache {
  private defaultCache: KeyToObjectCache;
  private typeToCacheMap: Map<string, KeyToObjectCache>;

  constructor() {
    this.defaultCache = new KeyToObjectCache();
    this.typeToCacheMap = new Map<string, KeyToObjectCache>();
  }

  add(key: CacheKey, object: any): void {
    if (isNullOrUndefined(key.type)) {
      this.defaultCache.add(key.key, object);
      return;
    }

    const cache: KeyToObjectCache =
      this.typeToCacheMap[key.type] || new KeyToObjectCache();
    this.typeToCacheMap[key.type] = cache;

    cache.add(key.key, object);
  }

  fetch(key: CacheKey): Promise<any> {
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
}