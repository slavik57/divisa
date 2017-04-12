import { Cache } from '../../caching/cache';

export interface WithinCacheResolver {
  resolve(cache: Cache, key: string, obj: any): Promise<boolean>;
}