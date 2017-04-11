import { stub, SinonStub } from 'sinon';
import { KeyToObjectCache } from './keyToObjectCache';
import { CacheCollisionError } from '../index';
import { expect } from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

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

    it('removing should remove existing object with same key', () => {
      const key = 'some key';
      const obj = {};
      const cache = new KeyToObjectCache();

      const fetch = cache.add(key, obj)
        .then(() => cache.remove(key))
        .then(() => cache.fetch(key));

      return expect(fetch).to.eventually.rejected;
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
  });

  describe('keys', () => {
    it('on empty cache should return empty', () => {
      const cache = new KeyToObjectCache();

      const keys: string[] = cache.keys;

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

  describe('size', () => {
    it('on empty cache should return 0', () => {
      const cache = new KeyToObjectCache();

      expect(cache.size).to.be.equal(0);
    })

    it('on cache with objects should return correct result', () => {
      const cache = new KeyToObjectCache();

      const size = cache.add('a', {})
        .then(() => cache.add('b', {}))
        .then(() => cache.add('c', {}))
        .then(() => cache.size);

      return expect(size).to.eventually.be.equal(3);
    })

    it('after removing should return correct result', () => {
      const cache = new KeyToObjectCache();

      const size = cache.add('a', {})
        .then(() => cache.add('b', {}))
        .then(() => cache.add('c', {}))
        .then(() => cache.remove('b'))
        .then(() => cache.size);

      return expect(size).to.eventually.be.equal(2);
    })
  })
});