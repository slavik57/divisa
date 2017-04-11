import { CacheKey } from "./cacheKey";
import { Resolver } from "../resolvers/resolver";
import { Observable } from "rxjs/Observable";

export interface CachePartition {
  add(key: CacheKey, object: any, resolver?: Resolver): Promise<boolean>;
  fetch(key: CacheKey): Promise<any>;
  remove(key: CacheKey): Promise<void>;

  getKeysByTypes(): Promise<Map<symbol | string, string[]>>;

  readonly keyAdded: Observable<CacheKey>;
  readonly keyRemoved: Observable<CacheKey>;
}