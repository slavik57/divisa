import { Resolver } from "./resolver";
import { Cache } from "../caching/cache";
import { CacheKey } from "../caching/cacheKey";

export class KeepNewResolver implements Resolver {
  resolve(cache: Cache, key: CacheKey, obj: any): Promise<boolean> {
    cache.remove(key);
    return cache.add(key, obj)
      .then(() => true);
  }
}