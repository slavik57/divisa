import { CacheKey } from "./cacheKey";
import { Resolver } from "../resolvers/resolver";
import { Observable } from "rxjs/Observable";
import { CacheInfo } from "./cacheInfo";
import { CacheObjectInfo } from "./cacheObjectInfo";

export interface CachePartition {
  add(key: CacheKey, object: any, resolver?: Resolver): Promise<boolean>;
  fetch(key: CacheKey): Promise<any>;
  remove(key: CacheKey): Promise<void>;

  getKeysByTypes(): Promise<Map<symbol | string, string[]>>;
  getInfo(): Promise<CacheInfo>;
  getObjectInfo(key: CacheKey): Promise<CacheObjectInfo>;

  readonly keyAdded: Observable<CacheKey>;
  readonly keyRemoved: Observable<CacheKey>;
}