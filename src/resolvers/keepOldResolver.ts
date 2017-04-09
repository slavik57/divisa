import { Resolver } from "./resolver";
import { Cache, CacheKey } from "../index";

export class KeepOldResolver implements Resolver {
  resolve(cache: Cache, key: CacheKey, obj: any): boolean {
    return false;
  }
}