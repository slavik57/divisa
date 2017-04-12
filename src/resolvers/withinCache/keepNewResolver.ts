import { WithinCacheResolver } from "./withinCacheResolver";
import { Cache } from "../../caching/cache";

export class KeepNewResolver implements WithinCacheResolver {
  public async resolve(cache: Cache, key: string, obj: any): Promise<boolean> {
    await cache.remove(key);
    await cache.add(key, obj);

    return true;
  }
}