import { CacheKey } from "./cacheKey";
import { Resolver } from "../resolvers/resolver";

export interface CachePartition {
  add(key: CacheKey, object: any, resolver?: Resolver): Promise<boolean>;
  fetch(key: CacheKey): Promise<any>;
  remove(key: CacheKey): Promise<void>;

  getKeysByTypes(): Map<symbol | string, string[]>;
}