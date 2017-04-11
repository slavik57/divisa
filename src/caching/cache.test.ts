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

    it('adding not existing key should resolve with true', () => {
      const key = 'some key';
      const obj = {};
      const cache = new Cache();

      const add = cache.add({ key: key }, obj);

      return expect(add).to.eventually.be.true;
    });

    it('fetching should return existing object with same key', () => {
      const key = 'some key';
      const obj = {};
      const cache = new Cache();

      const fetch = cache.add({ key: key }, obj)
        .then(() => cache.fetch({ key: key }));

      return expect(fetch).to.eventually.be.equal(obj);
    });

    it('fetching should reject on not existing key', () => {
      const cache = new Cache();

      const fetch = cache.add({ key: 'some key' }, {})
        .then(() => cache.fetch({ key: 'not existing key' }));

      return expect(fetch).to.eventually.rejected;
    });

    it('adding same key should result in error', () => {
      const cache = new Cache();
      const key = 'some key';

      const addTwice = cache.add({ key: key }, {})
        .then(() => cache.add({ key: key }, {}));

      return expect(addTwice).to.eventually.rejectedWith(CacheCollisionError)
    });

    it('register object with key, fetch with same key for different type, should reject', () => {
      const key = 'some key';
      const type = 'some type';
      const obj = {};

      const cache = new Cache();

      const fetch = cache.add({ key: key }, obj)
        .then(() => cache.fetch({ key: key, type: type }));

      return expect(fetch).to.eventually.rejected;
    });

    it('register object with key and type, fetch with different type, should reject', () => {
      const key = 'some key';
      const obj = {};

      const cache = new Cache();

      const fetch = cache.add({ key: key, type: 'some type' }, obj)
        .then(() => cache.fetch({ key: key, type: 'some other type' }));

      return expect(fetch).to.eventually.rejected;
    });

    it('register object with key and type, fetch with same type, should resolve with the object', () => {
      const key = 'some key';
      const type = 'some type';
      const obj = {};

      const cache = new Cache();

      const fetch = cache.add({ key: key, type: type }, obj)
        .then(() => cache.fetch({ key: key, type: type }));

      return expect(fetch).to.eventually.be.equal(obj);
    });

    it('register same object with same key but different types should not fail', () => {
      const key = 'some key';
      const obj = {};

      const cache = new Cache();

      const add = cache.add({ key: key, type: 'some type' }, obj)
        .then(() => cache.add({ key: key, type: 'some different type' }, obj));

      return expect(add).to.eventually.be.true;
    });

    it('register same object with same type but different keys should not fail', () => {
      const type = 'some type';
      const obj = {};

      const cache = new Cache();

      const add = cache.add({ key: 'some key', type: type }, obj)
        .then(() => cache.add({ key: 'some different key', type: type }, obj));

      return expect(add).to.eventually.be.true;
    });

    it('register object with same type and same key should fail', () => {
      const key = 'some key';
      const type = 'some type';
      const obj = {};

      const cache = new Cache();

      const add = cache.add({ key: key, type: type }, {})
        .then(() => cache.add({ key: key, type: type }, obj));

      return expect(add).to.eventually.rejectedWith(CacheCollisionError);
    });

    it('adding same key should use the resolver', () => {
      const cache = new Cache();
      const key = 'some key';
      const resolver: Resolver = {
        resolve: () => Promise.resolve(true)
      };
      const resolveSpy: SinonSpy = spy(resolver, 'resolve');

      const key1: CacheKey = { key: key };
      const key2: CacheKey = { key: key };
      const obj = {};

      const add = cache.add(key1, {})
        .then(() => cache.add(key2, obj, resolver));

      return add.then(() => {
        expect(resolveSpy.callCount).to.be.equal(1);
        expect(resolveSpy.args[0].length).to.be.equal(3);
        expect(resolveSpy.args[0][0]).to.be.equal(cache);
        expect(resolveSpy.args[0][1]).to.be.equal(key2);
        expect(resolveSpy.args[0][2]).to.be.equal(obj);
      });
    });

    it('adding object with same type and same key should use resolver', () => {
      const key = 'some key';
      const type = 'some type';
      const obj = {};
      const resolver: Resolver = {
        resolve: () => Promise.resolve(true)
      };
      const resolveSpy: SinonSpy = spy(resolver, 'resolve');

      const key1: CacheKey = { key: key, type: type };
      const key2: CacheKey = { key: key, type: type };

      const cache = new Cache();

      const add = cache.add(key1, {})
        .then(() => cache.add(key2, obj, resolver));

      return add.then(() => {
        expect(resolveSpy.callCount).to.be.equal(1);
        expect(resolveSpy.args[0].length).to.be.equal(3);
        expect(resolveSpy.args[0][0]).to.be.equal(cache);
        expect(resolveSpy.args[0][1]).to.be.equal(key2);
        expect(resolveSpy.args[0][2]).to.be.equal(obj);
      });
    });

    it('adding same key should return the resolver result', () => {
      const cache = new Cache();
      const key = 'some key';

      const result = {};
      const resolver: Resolver = {
        resolve: () => <Promise<boolean>>result
      };

      const key1: CacheKey = { key: key };
      const key2: CacheKey = { key: key };
      const obj = {};

      const add = cache.add(key1, {})
        .then(() => cache.add(key2, obj, resolver));

      return expect(add).to.eventually.be.equal(result);
    });

    it('adding object with same type and same key should return resolver result', () => {
      const key = 'some key';
      const type = 'some type';
      const obj = {};

      const result = {};
      const resolver: Resolver = {
        resolve: () => <Promise<boolean>>result
      };

      const key1: CacheKey = { key: key, type: type };
      const key2: CacheKey = { key: key, type: type };

      const cache = new Cache();

      const add = cache.add(key1, {})
        .then(() => cache.add(key2, obj, resolver));

      return expect(add).to.eventually.be.equal(result);
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

      const remove = cache.add({ key: 'some key' }, {})
        .then(() => cache.remove({ key: 'some other key' }))

      expect(remove).to.eventually.fulfilled;
    });

    it('removing existing key with different type should not fail and not remove the object', () => {
      const cache = new Cache();
      const obj = {};
      const key = 'some key';

      const fetch = cache.add({ key: key }, obj)
        .then(() => cache.remove({ key: key, type: 'some type' }))
        .then(() => cache.fetch({ key: key }));

      return expect(fetch).to.eventually.be.equal(obj);
    });

    it('removing existing type with different key should not fail and not remove the object', () => {
      const cache = new Cache();
      const obj = {};
      const key = 'some key';
      const type = 'some type';

      const fetch = cache.add({ key: key, type: type }, obj)
        .then(() => cache.remove({ key: 'different key', type: type }))
        .then(() => cache.fetch({ key: key, type: type }));

      return expect(fetch).to.eventually.be.equal(obj);
    });

    it('removing existing type with existing key should not fail and remove the object', () => {
      const cache = new Cache();
      const obj = {};
      const key = 'some key';
      const type = 'some type';

      const fetch = cache.add({ key: key, type: type }, obj)
        .then(() => cache.remove({ key: key, type: type }))
        .then(() => cache.fetch({ key: key, type: type }));

      return expect(fetch).to.eventually.rejected;
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

      const keysByTypesPromise = cache.add({ key: key }, obj)
        .then(() => cache.getKeysByTypes());

      return keysByTypesPromise.then((keysByTypes) => {
        expect(keysByTypes.size).to.be.equal(1);
        expect(keysByTypes.get(NO_TYPE)).to.be.deep.equal([key]);
      });
    })

    it('add object with type, should return a map with type', () => {
      const cache = new Cache();
      const key = 'some key';
      const type = 'some type';
      const obj = {};

      const keysByTypesPromise = cache.add({ key: key, type: type }, obj)
        .then(() => cache.getKeysByTypes());

      return keysByTypesPromise.then((keysByTypes) => {
        expect(keysByTypes.size).to.be.equal(1);
        expect(keysByTypes.get(type)).to.be.deep.equal([key]);
      });
    })

    it('add objects with and without types, should return a map with type', () => {
      const cache = new Cache();
      const key1 = 'some key1';
      const key2 = 'some key2';
      const key3 = 'some key3';
      const key4 = 'some key4';
      const type1 = 'some type1';
      const type2 = 'some type2';

      const keysByTypesPromise =
        cache.add({ key: key1 }, {})
          .then(() => cache.add({ key: key2, type: type1 }, {}))
          .then(() => cache.add({ key: key3, type: type2 }, {}))
          .then(() => cache.add({ key: key4, type: type2 }, {}))
          .then(() => cache.getKeysByTypes());

      return keysByTypesPromise.then((keysByTypes) => {
        expect(keysByTypes.size).to.be.equal(3);
        expect(keysByTypes.get(NO_TYPE)).to.be.deep.equal([key1]);
        expect(keysByTypes.get(type1)).to.be.deep.equal([key2]);
        expect(keysByTypes.get(type2)).to.be.deep.equal([key3, key4]);
      });
    })
  });
});