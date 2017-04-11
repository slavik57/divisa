import { Resolver } from "./resolver";
import { Cache } from "../caching/cache";
import { CacheKey } from "../caching/cacheKey";

export class KeepNewResolver implements Resolver {
  public async resolve(cache: Cache, key: CacheKey, obj: any): Promise<boolean> {
    await cache.remove(key);
    await cache.add(key, obj);

    return true;
  }
}