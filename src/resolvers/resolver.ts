
import { Cache } from '../index';
import { CacheKey } from "../index";

export interface Resolver {
  resolve(cache: Cache, key1: CacheKey, key2: CacheKey): void;
}