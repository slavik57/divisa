import { Cache } from '../../caching/cache';
import { CacheKey } from '../../caching/cacheKey';
import { CacheCollisionError } from '../../errors/errors';
import { ThrowErrorResolver } from "./throwErrorResolver";
import { spy, SinonSpy } from 'sinon';
import { expect } from 'chai';

describe('ThrowErrorResolver', () => {
  it('should not add the new object', () => {
    const key: CacheKey = { key: 'some key' };
    const obj = {};

    const cache = new Cache();
    const addSpy: SinonSpy = spy(cache, 'add');

    const resolver = new ThrowErrorResolver();

    return resolver.resolve(cache, key, obj).catch(() => {
      expect(addSpy.callCount).to.be.equal(0);
    });
  });

  it('should not remove the old object', () => {
    const key: CacheKey = { key: 'some key' };
    const obj = {};

    const cache = new Cache();
    const removeSpy: SinonSpy = spy(cache, 'remove');

    const resolver = new ThrowErrorResolver();

    return resolver.resolve(cache, key, obj).catch(() => {
      expect(removeSpy.callCount).to.be.equal(0);
    });
  });

  it('should throw error', () => {
    const key: CacheKey = { key: 'some key' };
    const obj = {};

    const cache = new Cache();

    const resolver = new ThrowErrorResolver();

    const result = resolver.resolve(cache, key, obj);

    expect(result).to.eventually.rejectedWith(CacheCollisionError);
  });
});