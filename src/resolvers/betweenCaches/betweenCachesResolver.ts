import { Cache } from '../../caching/cache';
import { CacheKey } from "../../caching/cacheKey";

export interface BetweenCachesResolver {
  resolve(mainCache: Cache, partition: Cache, key: CacheKey): Promise<boolean>;
}