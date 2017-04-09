import { Resolver } from "./resolver";
import { Cache, CacheKey } from "../index";

export class KeepNewResolver implements Resolver {
  resolve(cache: Cache, key: CacheKey, obj: any): boolean {
    cache.remove(key);
    cache.add(key, obj);
    return true;
  }
}