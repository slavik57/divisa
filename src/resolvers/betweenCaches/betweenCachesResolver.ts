import { Cache } from '../../caching/cache';

export interface BetweenCachesResolver {
  resolve(mainCache: Cache, partition: Cache, key: string): Promise<boolean>;
}