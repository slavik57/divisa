
import { Cache } from '../index';
import { CacheKey } from "../index";

export interface Resolver {
  resolve(cache: Cache, key: CacheKey, obj: any): void;
}