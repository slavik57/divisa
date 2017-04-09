import { Resolver } from "./resolver";
import { Cache, CacheKey, CacheCollisionError } from "../index";

export class ThrowErrorResolver implements Resolver {
  resolve(cache: Cache, key: CacheKey, obj: any): boolean {
    throw new CacheCollisionError(`The key [${key}] already exists in the cache`);
  }
}