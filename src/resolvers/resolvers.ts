export { Resolver } from './resolver';
import { ThrowErrorResolver } from './throwErrorResolver';
import { KeepNewResolver } from './keepNewResolver';
import { KeepOldResolver } from './keepOldResolver';

export class Resolvers {
  static KeepNewResolver = new KeepNewResolver();
  static KeepOldResolver = new KeepOldResolver();
  static ThrowErrorResolver = new ThrowErrorResolver();
}