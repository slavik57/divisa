import { Resolver } from "./resolver";
import { Cache } from "../caching/cache";
import { CacheKey } from "../caching/cacheKey";
import { CacheCollisionError } from "../errors/errors";

export class ThrowErrorResolver implements Resolver {
  public async resolve(cache: Cache, key: CacheKey, obj: any): Promise<boolean> {
    throw new CacheCollisionError(`The key [${key}] already exists in the cache`);
  }
}