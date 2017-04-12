import { Cache } from '../../caching/cache';
import { CacheKey } from "../../caching/cacheKey";

export interface WithinCacheResolver {
  resolve(cache: Cache, key: CacheKey, obj: any): Promise<boolean>;
}