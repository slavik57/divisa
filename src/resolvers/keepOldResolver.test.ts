import { Cache, CacheKey } from '../index';
import { KeepOldResolver } from "./keepOldResolver";
import { spy, SinonSpy } from 'sinon';
import { expect } from 'chai';

describe('KeepOldResolver', () => {
  it('should not add the new object', () => {
    const key: CacheKey = { key: 'some key' };
    const obj = {};

    const cache = new Cache();
    const addSpy: SinonSpy = spy(cache, 'add');

    const resolver = new KeepOldResolver();

    resolver.resolve(cache, key, obj);

    expect(addSpy.callCount).to.be.equal(0);
  });

  it('should not remove the old object', () => {
    const key: CacheKey = { key: 'some key' };
    const obj = {};

    const cache = new Cache();
    const removeSpy: SinonSpy = spy(cache, 'remove');

    const resolver = new KeepOldResolver();

    resolver.resolve(cache, key, obj);

    expect(removeSpy.callCount).to.be.equal(0);
  });

  it('should reeturn false', () => {
    const key: CacheKey = { key: 'some key' };
    const obj = {};

    const cache = new Cache();

    const resolver = new KeepOldResolver();

    const result: boolean = resolver.resolve(cache, key, obj);

    expect(result).to.be.false;
  });
});