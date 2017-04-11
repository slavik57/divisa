import { Resolver } from "./resolver";
import { Cache } from "../caching/cache";
import { CacheKey } from "../caching/cacheKey";

export class KeepOldResolver implements Resolver {
  public async resolve(cache: Cache, key: CacheKey, obj: any): Promise<boolean> {
    return false;
  }
}