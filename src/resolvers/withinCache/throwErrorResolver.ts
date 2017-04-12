import { WithinCacheResolver } from "./withinCacheResolver";
import { Cache } from "../../caching/cache";
import { CacheCollisionError } from "../../errors/errors";

export class ThrowErrorResolver implements WithinCacheResolver {
  public async resolve(cache: Cache, key: string, obj: any): Promise<boolean> {
    throw new CacheCollisionError(`The key [${key}] already exists in the cache`);
  }
}