import { ThrowErrorResolver } from './throwErrorResolver';
import { KeepNewResolver } from './keepNewResolver';
import { KeepOldResolver } from './keepOldResolver';

export class WithinCacheResolvers {
  static KeepNewResolver = new KeepNewResolver();
  static KeepOldResolver = new KeepOldResolver();
  static ThrowErrorResolver = new ThrowErrorResolver();
}