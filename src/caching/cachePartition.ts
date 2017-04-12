import { CacheKey } from "./cacheKey";
import { WithinCacheResolver } from "../resolvers/withinCache/withinCacheResolver";
import { Observable } from "rxjs/Observable";
import { CacheInfo } from "./cacheInfo";
import { CacheObjectInfo } from "./cacheObjectInfo";
import { BetweenCachesResolver } from "../resolvers/betweenCaches/betweenCachesResolver";

export interface CachePartition {
  add(key: CacheKey, object: any, resolver?: WithinCacheResolver): Promise<boolean>;
  fetch(key: CacheKey): Promise<any>;
  remove(key: CacheKey): Promise<void>;

  getKeysByTypes(): Promise<Map<symbol | string, string[]>>;
  getInfo(): Promise<CacheInfo>;
  getObjectInfo(key: CacheKey): Promise<CacheObjectInfo>;

  addCachePartition(partition: CachePartition, conflictResolver: BetweenCachesResolver, forType?: string): void;

  readonly keyAdded: Observable<CacheKey>;
  readonly keyRemoved: Observable<CacheKey>;
}