import { KeyToObjectCache } from "./keyToObjectCache";
import { isNullOrUndefined } from "../valueChekers/valueCheckers";

export class Cache {
  private defaultCache: KeyToObjectCache;
  private typeToCacheMap: Map<string, KeyToObjectCache>;

  constructor() {
    this.defaultCache = new KeyToObjectCache();
    this.typeToCacheMap = new Map<string, KeyToObjectCache>();
  }

  add(key: string, object: any, type?: string): void {
    if (isNullOrUndefined(type)) {
      this.defaultCache.add(key, object);
      return;
    }

    const cache: KeyToObjectCache =
      this.typeToCacheMap[type] || new KeyToObjectCache();
    this.typeToCacheMap[type] = cache;

    cache.add(key, object);
  }

  fetch(key: string, type?: string): Promise<any> {
    if (isNullOrUndefined(type)) {
      return this.defaultCache.fetch(key);
    }

    const typeCache: KeyToObjectCache = this.typeToCacheMap[type];
    if (!isNullOrUndefined(typeCache)) {
      return typeCache.fetch(key);
    } else {
      return Promise.reject(`There is no object registered for type [${type}] and key [${key}]`)
    }
  }
}