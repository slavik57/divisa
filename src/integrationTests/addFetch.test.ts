import { stub, SinonStub } from 'sinon';
import { Cache, CacheCollisionError } from '../index';
import { expect } from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

describe('Cache', () => {
  describe('add-fetch', () => {
    it('should reject on empty cache', () => {
      const cache = new Cache();
      return expect(cache.fetch('not existing key')).to.eventually.be.rejected;
    });

    it('should return existing object with same key', () => {
      const key = 'some key';
      const obj = {};
      const cache = new Cache();

      cache.add(key, obj);

      return expect(cache.fetch(key)).to.eventually.be.equal(obj);
    });

    it('should reject on not existing key', () => {
      const cache = new Cache();

      cache.add('some key', {});

      return expect(cache.fetch('not existing key')).to.eventually.rejected;
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