import { Resolver } from "./resolver";
import { Cache } from "../caching/cache";
import { CacheKey } from "../caching/cacheKey";

export class KeepNewResolver implements Resolver {
  resolve(cache: Cache, key: CacheKey, obj: any): boolean {
    cache.remove(key);
    cache.add(key, obj);
    return true;
  }
}