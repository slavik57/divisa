import { stub, SinonStub } from 'sinon';
import { KeyToObjectCache } from './keyToObjectCache';
import { CacheCollisionError } from '../index';
import { expect } from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import { CacheInfo } from "./cacheInfo";
import * as sizeof from "object-sizeof";

describe('KeyToObjectCache', () => {
  describe('add-fetch', () => {
    it('fetching should reject on empty cache', () => {
      const cache = new KeyToObjectCache();
      return expect(cache.fetch('not existing key')).to.eventually.be.rejected;
    });

    it('fetching should return existing object with same key', () => {
      const key = 'some key';
      const obj = {};
      const cache = new KeyToObjectCache();

      const onAdded = cache.add(key, obj);
      const fetch = onAdded.then(() => cache.fetch(key));

      return expect(fetch).to.eventually.be.equal(obj);
    });

    it('fetching should reject on not existing key', () => {
      const cache = new KeyToObjectCache();

      const onAdded = cache.add('some key', {});
      const fetch = onAdded.then(() => cache.fetch('not existing key'));

      return expect(fetch).to.eventually.rejected;
    });

    it('adding same key should result in error', () => {
      const cache = new KeyToObjectCache();
      const key = 'some key';

      const add = cache.add(key, {})
        .then(() => cache.add(key, {}));

      return expect(add).to.eventually.rejectedWith(CacheCollisionError)
    });

    it('removing should not fail on empty cache', () => {
      const cache = new KeyToObjectCache();
      return expect(cache.remove('not existing key')).to.eventually.fulfilled;
    });

    it('removing should return false on empty cache', async () => {
      const cache = new KeyToObjectCache();
      const result = await cache.remove('not existing key');

      expect(result).to.be.false;
    });

    it('removing should remove existing object with same key', () => {
      const key = 'some key';
      const obj = {};
      const cache = new KeyToObjectCache();

      const fetch = cache.add(key, obj)
        .then(() => cache.remove(key))
        .then(() => cache.fetch(key));

      return expect(fetch).to.eventually.rejected;
    });

    it('removing existing object with same key should return true', async () => {
      const key = 'some key';
      const obj = {};
      const cache = new KeyToObjectCache();

      await cache.add(key, obj);
      const result = await cache.remove(key);

      expect(result).to.be.true;
    });

    it('removing should not fail on not existing key and not remove the object', () => {
      const cache = new KeyToObjectCache();
      const key = 'some key';
      const obj = {};

      const fetch = cache.add(key, obj)
        .then(() => cache.remove('some other key'))
        .then(() => cache.fetch(key));

      return expect(fetch).to.eventually.be.equal(obj);
    });

    it('removing not existing key should return false', async () => {
      const cache = new KeyToObjectCache();
      const key = 'some key';
      const obj = {};

      await cache.add(key, obj);
      const result = await cache.remove('some other key');

      expect(result).to.be.false;
    });
  });

  describe('keys', () => {
    it('on empty cache should return empty', async () => {
      const cache = new KeyToObjectCache();

      const keys: string[] = await cache.keys;

      expect(keys).to.be.empty;
    });

    it('on cache with keys should return correct result', () => {
      const cache = new KeyToObjectCache();
      const key1 = 'some key';
      const key2 = 'some other key';

      const keys = cache.add(key1, {})
        .then(() => cache.add(key2, {}))
        .then(() => cache.keys);

      return expect(keys).to.eventually.deep.equal([key1, key2]);
    });
  });

  describe('info', () => {
    it('on empty cache should return correct info', async () => {
      const cache = new KeyToObjectCache();

      const info = await cache.info;

      const expected: CacheInfo = {
        numberOfObjects: 0,
        sizeInBytes: 0
      };

      expect(info).to.deep.equal(expected);
    })

    it('on cache with objects should return correct result', async () => {
      const cache = new KeyToObjectCache();

      const obj1 = { a: 1 };
      const obj2 = { ba: 'asfd' };
      const obj3 = { adgasg: null };

      await cache.add('a', obj1);
      await cache.add('b', obj2);
      await cache.add('c', obj3);

      const totalSize = sizeof(obj1) + sizeof(obj2) + sizeof(obj3);
      const expected: CacheInfo = {
        numberOfObjects: 3,
        sizeInBytes: totalSize
      };

      const info = await cache.info;

      expect(info).to.deep.equal(expected);
    })

    it('after removing should return correct result', async () => {
      const cache = new KeyToObjectCache();

      const obj1 = { a: 1 };
      const obj2 = { ba: 'asfd' };
      const obj3 = { adgasg: null };

      await cache.add('a', obj1);
      await cache.add('b', obj2);
      await cache.add('c', obj3);

      await cache.remove('b');

      const totalSize = sizeof(obj1) + sizeof(obj3);
      const expected: CacheInfo = {
        numberOfObjects: 2,
        sizeInBytes: totalSize
      };

      const info = await cache.info;

      expect(info).to.deep.equal(expected);
    })
  })

  describe('getObjectInfo', () => {
    it('on empty cache should reject', () => {
      const cache = new KeyToObjectCache();

      return expect(cache.getObjectInfo('some key')).to.eventually.rejected;
    });

    it('on not existing key should reject', async () => {
      const cache = new KeyToObjectCache();

      await cache.add('some key', {});

      return expect(cache.getObjectInfo('some other key')).to.eventually.rejected;
    });

    it('on existing key should return correct info', async () => {
      const cache = new KeyToObjectCache();
      const key = 'some key';
      const obj = { asdad: 'asda', dhfdf: 213, dyh: null };

      const beforeAdd = new Date();
      await cache.add(key, obj);
      const afterAdd = new Date();

      const info = await cache.getObjectInfo(key);

      expect(info.sizeInBytes).to.be.equal(sizeof(obj));
      expect(info.dateAdded.valueOf()).to.be.least(beforeAdd.valueOf());
      expect(info.dateAdded.valueOf()).to.be.least(afterAdd.valueOf());
    });
  })
});