import { stub, SinonStub } from 'sinon';
import { Cache, CacheCollisionError } from '../index';
import { expect } from 'chai';

describe('Cache', () => {
  describe('add-fetch', () => {
    it('should return null on empty cache', () => {
      const cache = new Cache();
      expect(cache.fetch('not existing key')).to.be.null;
    });

    it('should return existing object with same key', () => {
      const key = 'some key';
      const obj = {};
      const cache = new Cache();

      cache.add(key, obj);

      expect(cache.fetch(key)).to.be.equal(obj);
    });

    it('should return null on not existing key', () => {
      const cache = new Cache();

      cache.add('some key', {});

      expect(cache.fetch('not existing key')).to.be.null;
    });

    it('adding same key should result in error', () => {
      const cache = new Cache();
      const key = 'some key';

      cache.add(key, {});
      const addingAction = () => cache.add(key, {});

      expect(addingAction).to.throw(CacheCollisionError)
    });
  });
});