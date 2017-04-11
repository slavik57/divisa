import { Cache } from '../caching/cache';
import { CacheKey } from "../caching/cacheKey";

export interface Resolver {
  resolve(cache: Cache, key: CacheKey, obj: any): Promise<boolean>;
}