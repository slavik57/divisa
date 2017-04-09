import { Cache } from '../cache/cache';
import { CacheKey } from "../index";

export interface Resolver {
  resolve(cache: Cache, key: CacheKey, obj: any): boolean;
}