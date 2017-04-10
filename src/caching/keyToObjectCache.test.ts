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
});