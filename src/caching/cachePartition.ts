import { CacheKey } from "./cacheKey";
import { Resolver } from "../resolvers/resolver";
import { Observable } from "rxjs/observable";

export interface CachePartition {
  add(key: CacheKey, object: any, resolver?: Resolver): Promise<boolean>;
  fetch(key: CacheKey): Promise<any>;
  remove(key: CacheKey): Promise<void>;

  getKeysByTypes(): Promise<Map<symbol | string, string[]>>;

  readonly keyAdded: Observable<CacheKey>;
}