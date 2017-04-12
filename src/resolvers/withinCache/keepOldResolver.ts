import { WithinCacheResolver } from "./withinCacheResolver";
import { Cache } from "../../caching/cache";

export class KeepOldResolver implements WithinCacheResolver {
  public async resolve(cache: Cache, key: string, obj: any): Promise<boolean> {
    return false;
  }
}