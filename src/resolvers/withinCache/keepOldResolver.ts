import { WithinCacheResolver } from "./withinCacheResolver";
import { Cache } from "../../caching/cache";
import { CacheKey } from "../../caching/cacheKey";

export class KeepOldResolver implements WithinCacheResolver {
  public async resolve(cache: Cache, key: CacheKey, obj: any): Promise<boolean> {
    return false;
  }
}