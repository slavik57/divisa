import { WithinCacheResolver } from "../resolvers/withinCache/withinCacheResolver";
import { Observable } from "rxjs/Observable";
import { CacheInfo } from "./cacheInfo";
import { CacheObjectInfo } from "./cacheObjectInfo";
import { BetweenCachesResolver } from "../resolvers/betweenCaches/betweenCachesResolver";
import { CacheKey } from "./cacheKey";

export interface CachePartition {
  add(key: string, object: any, resolver?: WithinCacheResolver): Promise<boolean>;
  fetch(key: string): Promise<any>;
  remove(key: string): Promise<void>;

  getKeys(): Promise<CacheKey[]>;
  getInfo(): Promise<CacheInfo>;
  getObjectInfo(key: string): Promise<CacheObjectInfo>;

  addCachePartition(partition: CachePartition, conflictResolver?: BetweenCachesResolver): Promise<void>;

  readonly keyAdded: Observable<CacheKey>;
  readonly keyRemoved: Observable<CacheKey>;
}