import { spy, SinonSpy } from 'sinon';
import { expect } from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import { Cache } from './cache';
import { CacheCollisionError } from "../index";
import { Resolver } from "../resolvers/resolvers";
import { CacheKey } from "./cacheKey";
import { NO_TYPE } from "./noType";

describe('Cache', () => {
  describe('add-fetch', () => {
    it('fetching should reject on empty cache', () => {
      const cache = new Cache();
      return expect(cache.fetch({ key: 'not existing key' })).to.eventually.be.rejected;
    });

    it('fetching should return existing object with same key', () => {
      const key = 'some key';
      const obj = {};
      const cache = new Cache();

      expect(cache.add({ key: key }, obj)).to.be.true;

      return expect(cache.fetch({ key: key })).to.eventually.be.equal(obj);
    });

    it('fetching should reject on not existing key', () => {
      const cache = new Cache();

      expect(cache.add({ key: 'some key' }, {})).to.be.true;

      return expect(cache.fetch({ key: 'not existing key' })).to.eventually.rejected;
    });

    it('adding same key should result in error', () => {
      const cache = new Cache();
      const key = 'some key';

      expect(cache.add({ key: key }, {})).to.be.true;
      const addingAction = () => cache.add({ key: key }, {});

      expect(addingAction).to.throw(CacheCollisionError)
    });

    it('register object with key, fetch with same key for different type, should reject', () => {
      const key = 'some key';
      const type = 'some type';
      const obj = {};

      const cache = new Cache();

      expect(cache.add({ key: key }, obj)).to.be.true;

      return expect(cache.fetch({ key: key, type: type })).to.eventually.rejected;
    });

    it('register object with key and type, fetch with different type, should reject', () => {
      const key = 'some key';
      const obj = {};

      const cache = new Cache();

      expect(cache.add({ key: key, type: 'some type' }, obj)).to.be.true;

      return expect(cache.fetch({ key: key, type: 'some other type' })).to.eventually.rejected;
    });

    it('register object with key and type, fetch with same type, should resolve with the object', () => {
      const key = 'some key';
      const type = 'some type';
      const obj = {};

      const cache = new Cache();

      expect(cache.add({ key: key, type: type }, obj)).to.be.true;

      return expect(cache.fetch({ key: key, type: type })).to.eventually.be.equal(obj);
    });

    it('register same object with same key but different types should not fail', () => {
      const key = 'some key';
      const obj = {};

      const cache = new Cache();

      expect(cache.add({ key: key, type: 'some type' }, obj)).to.be.true;
      expect(cache.add({ key: key, type: 'some different type' }, obj)).to.be.true;
    });

    it('register same object with same type but different keys should not fail', () => {
      const type = 'some type';
      const obj = {};

      const cache = new Cache();

      expect(cache.add({ key: 'some key', type: type }, obj)).to.be.true;
      expect(cache.add({ key: 'some different key', type: type }, obj)).to.be.true;
    });

    it('register object with same type and same key should fail', () => {
      const key = 'some key';
      const type = 'some type';
      const obj = {};

      const cache = new Cache();

      expect(cache.add({ key: key, type: type }, {})).to.be.true;
      const addAction = () => cache.add({ key: key, type: type }, obj);

      expect(addAction).to.throw(CacheCollisionError);
    });

    it('adding same key should use the resolver', () => {
      const cache = new Cache();
      const key = 'some key';
      const resolver: Resolver = {
        resolve: () => true
      };
      const resolveSpy: SinonSpy = spy(resolver, 'resolve');

      const key1: CacheKey = { key: key };
      const key2: CacheKey = { key: key };
      const obj = {};
      expect(cache.add(key1, {})).to.be.true;
      expect(cache.add(key2, obj, resolver)).to.be.true;

      expect(resolveSpy.callCount).to.be.equal(1);
      expect(resolveSpy.args[0].length).to.be.equal(3);
      expect(resolveSpy.args[0][0]).to.be.equal(cache);
      expect(resolveSpy.args[0][1]).to.be.equal(key2);
      expect(resolveSpy.args[0][2]).to.be.equal(obj);
    });

    it('adding object with same type and same key should use resolver', () => {
      const key = 'some key';
      const type = 'some type';
      const obj = {};
      const resolver: Resolver = {
        resolve: () => true
      };
      const resolveSpy: SinonSpy = spy(resolver, 'resolve');

      const key1: CacheKey = { key: key, type: type };
      const key2: CacheKey = { key: key, type: type };

      const cache = new Cache();

      expect(cache.add(key1, {})).to.be.true;
      expect(cache.add(key2, obj, resolver)).to.be.true;

      expect(resolveSpy.callCount).to.be.equal(1);
      expect(resolveSpy.args[0].length).to.be.equal(3);
      expect(resolveSpy.args[0][0]).to.be.equal(cache);
      expect(resolveSpy.args[0][1]).to.be.equal(key2);
      expect(resolveSpy.args[0][2]).to.be.equal(obj);
    });

    it('adding same key should return the resolver result', () => {
      const cache = new Cache();
      const key = 'some key';

      const result = {};
      const resolver: Resolver = {
        resolve: () => <boolean>result
      };

      const key1: CacheKey = { key: key };
      const key2: CacheKey = { key: key };
      const obj = {};

      expect(cache.add(key1, {})).to.be.true;
      expect(cache.add(key2, obj, resolver)).to.be.equal(result);
    });

    it('adding object with same type and same key should return resolver result', () => {
      const key = 'some key';
      const type = 'some type';
      const obj = {};

      const result = {};
      const resolver: Resolver = {
        resolve: () => <boolean>result
      };

      const key1: CacheKey = { key: key, type: type };
      const key2: CacheKey = { key: key, type: type };

      const cache = new Cache();

      expect(cache.add(key1, {})).to.be.true;
      expect(cache.add(key2, obj, resolver)).to.be.equal(result);
    });

    it('removing key on empty cache should not fail', () => {
      const cache = new Cache();

      cache.remove({ key: 'some key' });
    });

    it('removing key with type on empty cache should not fail', () => {
      const cache = new Cache();

      cache.remove({ key: 'some key', type: 'some type' });
    });

    it('removing not existing key should not fail', () => {
      const cache = new Cache();

      expect(cache.add({ key: 'some key' }, {})).to.be.true;

      cache.remove({ key: 'some other key' });
    });

    it('removing existing key with different type should not fail and not remove the object', () => {
      const cache = new Cache();
      const obj = {};
      const key = 'some key';

      expect(cache.add({ key: key }, obj)).to.be.true;

      cache.remove({ key: key, type: 'some type' });

      return expect(cache.fetch({ key: key })).to.eventually.be.equal(obj);
    });

    it('removing existing type with different key should not fail and not remove the object', () => {
      const cache = new Cache();
      const obj = {};
      const key = 'some key';
      const type = 'some type';

      expect(cache.add({ key: key, type: type }, obj)).to.be.true;

      cache.remove({ key: 'different key', type: type });

      return expect(cache.fetch({ key: key, type: type })).to.eventually.be.equal(obj);
    });

    it('removing existing type with existing key should not fail and remove the object', () => {
      const cache = new Cache();
      const obj = {};
      const key = 'some key';
      const type = 'some type';

      expect(cache.add({ key: key, type: type }, obj)).to.be.true;

      cache.remove({ key: key, type: type });

      return expect(cache.fetch({ key: key, type: type })).to.eventually.rejected;
    });
  });

  describe('getKeysByTypes', () => {
    it('should return empty map on empty cache', () => {
      const cache = new Cache();

      const keysByTypes = cache.getKeysByTypes();

      expect(keysByTypes.size).to.be.equal(0);
    })

    it('add object without type, should return a map with default type', () => {
      const cache = new Cache();
      const key = 'some key';
      const obj = {};

      cache.add({ key: key }, obj);

      const keysByTypes = cache.getKeysByTypes();

      expect(keysByTypes.size).to.be.equal(1);
      expect(keysByTypes.get(NO_TYPE)).to.be.deep.equal([key]);
    })
  });
});