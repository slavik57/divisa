import { Cache } from '../caching/cache';
import { CacheKey } from '../caching/cacheKey';
import { KeepNewResolver } from "./keepNewResolver";
import { spy, SinonSpy } from 'sinon';
import { expect } from 'chai';

describe('KeepNewResolver', () => {
  it('should add the new object', () => {
    const key: CacheKey = { key: 'some key' };
    const obj = {};

    const cache = new Cache();
    const addSpy: SinonSpy = spy(cache, 'add');

    const resolver = new KeepNewResolver();

    resolver.resolve(cache, key, obj);

    expect(addSpy.callCount).to.be.equal(1);
    expect(addSpy.args[0]).to.be.length(2);
    expect(addSpy.args[0][0]).to.be.equal(key);
    expect(addSpy.args[0][1]).to.be.equal(obj);
  });

  it('should remove the old object', () => {
    const key: CacheKey = { key: 'some key' };
    const obj = {};

    const cache = new Cache();
    const removeSpy: SinonSpy = spy(cache, 'remove');

    const resolver = new KeepNewResolver();

    resolver.resolve(cache, key, obj);

    expect(removeSpy.callCount).to.be.equal(1);
    expect(removeSpy.args[0]).to.be.length(1);
    expect(removeSpy.args[0][0]).to.be.equal(key);
  });

  it('should reeturn true', () => {
    const key: CacheKey = { key: 'some key' };
    const obj = {};

    const cache = new Cache();

    const resolver = new KeepNewResolver();

    const result: boolean = resolver.resolve(cache, key, obj);

    expect(result).to.be.true;
  });
});