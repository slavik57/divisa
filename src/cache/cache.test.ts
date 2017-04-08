import { stub, SinonStub } from 'sinon';
import { expect } from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import { Cache } from './cache';
import { CacheCollisionError } from "../index";

describe('Cache', () => {
  describe('add-fetch', () => {
    it('fetching should reject on empty cache', () => {
      const cache = new Cache();
      return expect(cache.fetch('not existing key')).to.eventually.be.rejected;
    });

    it('fetching should return existing object with same key', () => {
      const key = 'some key';
      const obj = {};
      const cache = new Cache();

      cache.add(key, obj);

      return expect(cache.fetch(key)).to.eventually.be.equal(obj);
    });

    it('fetching should reject on not existing key', () => {
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

    it('register object with key, fetch with same key for different type, should reject', () => {
      const key = 'some key';
      const type = 'some type';
      const obj = {};

      const cache = new Cache();

      cache.add(key, obj);

      return expect(cache.fetch(key, type)).to.eventually.rejected;
    });

    it('register object with key and type, fetch with different type, should reject', () => {
      const key = 'some key';
      const obj = {};

      const cache = new Cache();

      cache.add(key, obj, 'some type');

      return expect(cache.fetch(key, 'some other type')).to.eventually.rejected;
    });

    it('register object with key and type, fetch with same type, should resolve with the object', () => {
      const key = 'some key';
      const type = 'some type';
      const obj = {};

      const cache = new Cache();

      cache.add(key, obj, type);

      return expect(cache.fetch(key, type)).to.eventually.be.equal(obj);
    });

    it('register same object with same key but different types should not fail', () => {
      const key = 'some key';
      const obj = {};

      const cache = new Cache();

      cache.add(key, obj, 'some type');
      cache.add(key, obj, 'some different type');
    });

    it('register same object with same type but different keys should not fail', () => {
      const type = 'some type';
      const obj = {};

      const cache = new Cache();

      cache.add('some key', obj, type);
      cache.add('some different key', obj, type);
    });

    it('register same object with same type and same key should fail', () => {
      const key = 'some key';
      const type = 'some type';
      const obj = {};

      const cache = new Cache();

      cache.add(key, obj, type);
      const addAction = () => cache.add(key, obj, type);

      expect(addAction).to.throw(CacheCollisionError);
    });
  });
});