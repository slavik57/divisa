import { ThrowErrorResolver } from './throwErrorResolver';
import { KeepNewResolver } from './keepNewResolver';
import { KeepOldResolver } from './keepOldResolver';

export { WithinCacheResolver } from './withinCacheResolver';

export class WithinCacheResolvers {
  static KeepNewResolver = new KeepNewResolver();
  static KeepOldResolver = new KeepOldResolver();
  static ThrowErrorResolver = new ThrowErrorResolver();
}