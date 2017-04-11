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

      cache.add(key, obj);

      return expect(cache.fetch(key)).to.eventually.be.equal(obj);
    });

    it('fetching should reject on not existing key', () => {
      const cache = new KeyToObjectCache();

      cache.add('some key', {});

      return expect(cache.fetch('not existing key')).to.eventually.rejected;
    });

    it('adding same key should result in error', () => {
      const cache = new KeyToObjectCache();
      const key = 'some key';

      cache.add(key, {});
      const addingAction = () => cache.add(key, {});

      expect(addingAction).to.throw(CacheCollisionError)
    });

    it('removing should not fail on empty cache', () => {
      const cache = new KeyToObjectCache();
      cache.remove('not existing key');
    });

    it('removing should remove existing object with same key', () => {
      const key = 'some key';
      const obj = {};
      const cache = new KeyToObjectCache();

      cache.add(key, obj);
      cache.remove(key);

      return expect(cache.fetch(key)).to.eventually.rejected;
    });

    it('removing should not fail on not existing key and not remove the object', () => {
      const cache = new KeyToObjectCache();
      const key = 'some key';
      const obj = {};

      cache.add(key, obj);
      cache.remove('some other key');

      return expect(cache.fetch(key)).to.eventually.be.equal(obj);
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

      cache.add(key1, {});
      cache.add(key2, {});

      const keys: string[] = cache.keys;

      expect(keys).to.be.deep.equal([key1, key2]);
    });
  });

  describe('size', () => {
    it('on empty cache should return 0', () => {
      const cache = new KeyToObjectCache();

      expect(cache.size).to.be.equal(0);
    })

    it('on cache with objects should return correct result', () => {
      const cache = new KeyToObjectCache();

      cache.add('a', {});
      cache.add('b', {});
      cache.add('c', {});

      expect(cache.size).to.be.equal(3);
    })

    it('after removing should return correct result', () => {
      const cache = new KeyToObjectCache();

      cache.add('a', {});
      cache.add('b', {});
      cache.add('c', {});
      cache.remove('b');

      expect(cache.size).to.be.equal(2);
    })
  })
});