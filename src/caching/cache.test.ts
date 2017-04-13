import { spy, stub, SinonSpy } from 'sinon';
import { expect } from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import { Cache } from './cache';
import { CacheCollisionError, KeyNotFoundError } from "../errors/errors";
import { WithinCacheResolver } from "../resolvers/withinCache/withinCacheResolver";
import { WithinCacheResolvers } from "../resolvers/withinCache/withinCacheResolvers";
import { BetweenCachesResolver } from "../resolvers/betweenCaches/betweenCachesResolver";
import { CacheInfo } from "./cacheInfo";
import * as sizeof from 'object-sizeof';
import { Subject } from "rxjs/Subject";
import { CacheKey } from "./cacheKey";

describe('Cache', () => {
  describe('add-fetch-remove', () => {
    it('fetching should reject on empty cache', () => {
      const cache = new Cache();
      return expect(cache.fetch('not existing key')).to.eventually.be.rejectedWith(KeyNotFoundError);
    });

    it('adding not existing key should resolve with true', async () => {
      const key = 'some key';
      const obj = {};
      const cache = new Cache();

      const result = await cache.add(key, obj);

      expect(result).to.be.true;
    });

    it('fetching should return existing object with same key', async () => {
      const key = 'some key';
      const obj = {};
      const cache = new Cache();

      await cache.add(key, obj);

      const result = await cache.fetch(key);

      expect(result).to.be.equal(obj);
    });

    it('fetching should reject on not existing key', async () => {
      const cache = new Cache();

      await cache.add('some key', {});

      return expect(cache.fetch('not existing key')).to.eventually.rejected;
    });

    it('adding same key should result in error', async () => {
      const cache = new Cache();
      const key = 'some key';

      await cache.add(key, {});

      return expect(cache.add(key, {})).to.eventually.rejectedWith(CacheCollisionError)
    });

    it('adding same key should use the resolver', async () => {
      const cache = new Cache();
      const resolver: WithinCacheResolver = {
        resolve: () => Promise.resolve(true)
      };
      const resolveSpy: SinonSpy = spy(resolver, 'resolve');

      const key = 'some key';
      const obj = {};

      await cache.add(key, {});
      await cache.add(key, obj, resolver);

      expect(resolveSpy.callCount).to.be.equal(1);
      expect(resolveSpy.args[0].length).to.be.equal(3);
      expect(resolveSpy.args[0][0]).to.be.equal(cache);
      expect(resolveSpy.args[0][1]).to.be.equal(key);
      expect(resolveSpy.args[0][2]).to.be.equal(obj);
    });

    it('adding same key should return the resolver result', async () => {
      const cache = new Cache();

      const result = {};
      const resolver: WithinCacheResolver = {
        resolve: () => <Promise<boolean>>result
      };

      const key = 'some key';
      const obj = {};

      await cache.add(key, {});
      const addResult = await cache.add(key, obj, resolver);

      expect(addResult).to.be.equal(result);
    });

    it('removing key on empty cache should not fail', () => {
      const cache = new Cache();

      return expect(cache.remove('some key')).to.eventually.fulfilled;
    });

    it('removing not existing key should not fail', async () => {
      const cache = new Cache();

      await cache.add('some key', {});
      await cache.remove('some other key');
    });

    it('removing with not existing key should not fail and not remove the object', async () => {
      const cache = new Cache();
      const obj = {};
      const key = 'some key';

      await cache.add(key, obj);
      await cache.remove('not existing key');
      const result = await cache.fetch(key);

      expect(result).to.be.equal(obj);
    });

    it('removing with existing key should not fail and remove the object', async () => {
      const cache = new Cache();
      const obj = {};
      const key = 'some key';

      await cache.add(key, obj);
      await cache.remove(key);

      return expect(cache.fetch(key)).to.eventually.rejected;
    });

    it('remove key that exists in partition, should remove from partition', async () => {
      const cache = new Cache();
      const partition = new Cache();
      await cache.addCachePartition(partition);

      const key = 'some key';
      await partition.add(key, {});

      await cache.remove(key);

      return expect(partition.fetch(key)).to.eventually.rejectedWith(KeyNotFoundError);
    })
  });

  describe('getKeys', () => {
    it('should return empty list on empty cache', async () => {
      const cache = new Cache();

      const keys = await cache.getKeys();

      return expect(keys).to.be.empty;
    })

    it('add object, should return correct result', async () => {
      const cache = new Cache();
      const key = 'some key';
      const obj = {};

      await cache.add(key, obj);

      const keys: CacheKey[] = await cache.getKeys();

      expect(keys).to.be.length(1);
      expect(keys[0].key).to.be.equal(key);
    })

    it('add multiple objects, should return correct result', async () => {
      const cache = new Cache();
      const key1 = 'some key1';
      const key2 = 'some key2';
      const key3 = 'some key3';
      const key4 = 'some key4';

      await cache.add(key1, {});
      await cache.add(key2, {});
      await cache.add(key3, {});
      await cache.add(key4, {});

      const cacheKeys = await cache.getKeys();
      const keys = cacheKeys.map(_ => _.key);

      expect(keys).to.be.deep.equal([key1, key2, key3, key4]);
    })

    it('should return keys from all partitions', async () => {

      const key1 = 'key1';
      const key2 = 'key2';
      const key3 = 'key3';
      const key4 = 'key4';

      const partition1 = new Cache();
      const partition2 = new Cache();
      const partition3 = new Cache();

      await partition1.add(key1, {});
      await partition2.add(key2, {});
      await partition3.add(key3, {});

      const cache = new Cache();
      await cache.add(key4, {});

      await cache.addCachePartition(partition1);
      await cache.addCachePartition(partition2);
      await cache.addCachePartition(partition3);

      const cacheKeys = await cache.getKeys();
      const keys = cacheKeys.map(_ => _.key);

      expect(keys).to.be.length(4);
      expect(keys).to.contain(key1);
      expect(keys).to.contain(key2);
      expect(keys).to.contain(key3);
      expect(keys).to.contain(key4);
    });

    it('after removing from partitions should return correct keys from all partitions', async () => {

      const key1 = 'key1';
      const key2 = 'key2';
      const key3 = 'key3';
      const key4 = 'key4';

      const partition1 = new Cache();
      const partition2 = new Cache();
      const partition3 = new Cache();

      await partition1.add(key1, {});
      await partition2.add(key2, {});
      await partition3.add(key3, {});

      const cache = new Cache();
      await cache.add(key4, {});

      await cache.addCachePartition(partition1);
      await cache.addCachePartition(partition2);
      await cache.addCachePartition(partition3);

      await partition2.remove(key2);

      const cacheKeys = await cache.getKeys();
      const keys = cacheKeys.map(_ => _.key);

      expect(keys).to.be.length(3);
      expect(keys).to.contain(key1);
      expect(keys).to.not.contain(key2);
      expect(keys).to.contain(key3);
      expect(keys).to.contain(key4);
    });
  });

  describe('keyAdded', () => {
    it('adding key should raise keyAdded', async () => {
      const cache = new Cache();

      const spyCallback: SinonSpy = spy();
      cache.keyAdded.subscribe(spyCallback);

      const key = 'some key';
      await cache.add(key, {});

      expect(spyCallback.callCount).to.be.equal(1);
      expect(spyCallback.args[0]).to.be.length(1);
      expect(spyCallback.args[0][0].key).to.be.equal(key);
    });

    it('adding with existing key should not raise keyAdded', async () => {
      const cache = new Cache();

      const key = 'some key';

      await cache.add(key, {});

      const spyCallback: SinonSpy = spy();
      cache.keyAdded.subscribe(spyCallback);

      try {
        await cache.add(key, {});
      } catch (e) {
      }

      expect(spyCallback.callCount).to.be.equal(0);
    });

    it('adding with existing key with KeepNewResolver should raise keyAdded', async () => {
      const cache = new Cache();

      const key = 'some key';
      await cache.add(key, {});

      const spyCallback: SinonSpy = spy();
      cache.keyAdded.subscribe(spyCallback);

      await cache.add(key, {}, WithinCacheResolvers.KeepNewResolver);

      expect(spyCallback.callCount).to.be.equal(1);
    });

    it('adding with existing key with KeepOldResolver should not raise keyAdded', async () => {
      const cache = new Cache();

      const key = 'some key';

      await cache.add(key, {});

      const spyCallback: SinonSpy = spy();
      cache.keyAdded.subscribe(spyCallback);

      await cache.add(key, {}, WithinCacheResolvers.KeepOldResolver);

      expect(spyCallback.callCount).to.be.equal(0);
    });

    it('adding to partition should raise keyAdded for main cache as well', async () => {
      const key = 'some key';
      const partition = new Cache();
      const cache = new Cache();

      await cache.addCachePartition(partition);

      const keyAddedSpy = spy();
      cache.keyAdded.subscribe(keyAddedSpy);

      await partition.add(key, {});
      const info = await partition.getObjectInfo(key);

      expect(keyAddedSpy.callCount).to.be.equal(1);
      expect(keyAddedSpy.args[0]).to.be.length(1);
      expect(keyAddedSpy.args[0][0].key).to.be.equal(key);
      expect(keyAddedSpy.args[0][0].keyId).to.be.equal(info.keyId);
    });

    it('keyAdded raised twice from the partition should raise keyAdded only once', async () => {
      const key = 'some key';
      const partition = new Cache();
      const partitionKeyAdded = new Subject<CacheKey>();
      stub(partition, 'keyAdded', { get: () => partitionKeyAdded });

      const cache = new Cache();
      await cache.addCachePartition(partition);

      const keyAddedSpy = spy();
      cache.keyAdded.subscribe(keyAddedSpy);

      partitionKeyAdded.next(new CacheKey(key));
      partitionKeyAdded.next(new CacheKey(key));

      expect(keyAddedSpy.callCount).to.be.equal(1);
      expect(keyAddedSpy.args[0]).to.be.length(1);
      expect(keyAddedSpy.args[0][0].key).to.be.equal(key);
    });
  });

  describe('keyRemoved', () => {

    it('removing key on empty cache should not raise keyRemoved', async () => {
      const cache = new Cache();

      const spyCallback: SinonSpy = spy();
      cache.keyRemoved.subscribe(spyCallback);

      await cache.remove('some key');

      expect(spyCallback.callCount).to.be.equal(0);
    });

    it('removing not existing key should not raise keyRemoved', async () => {
      const cache = new Cache();

      const spyCallback: SinonSpy = spy();
      cache.keyRemoved.subscribe(spyCallback);

      await cache.add('some key', {});

      await cache.remove('some other key');

      expect(spyCallback.callCount).to.be.equal(0);
    });

    it('removing existing key should raise keyRemoved', async () => {
      const cache = new Cache();

      const key = 'some key';

      await cache.add(key, {});

      const spyCallback: SinonSpy = spy();
      cache.keyRemoved.subscribe(spyCallback);

      await cache.remove(key);

      expect(spyCallback.callCount).to.be.equal(1);
      expect(spyCallback.args[0]).to.be.length(1);
      expect(spyCallback.args[0][0].key).to.be.equal(key);
    });

    it('adding with existing key with KeepNewResolver should raise keyRemoved', async () => {
      const cache = new Cache();

      const key = 'some key';

      await cache.add(key, {});

      const spyCallback: SinonSpy = spy();
      cache.keyRemoved.subscribe(spyCallback);

      await cache.add(key, {}, WithinCacheResolvers.KeepNewResolver);

      expect(spyCallback.callCount).to.be.equal(1);
    });

    it('adding with existing key with KeepNewResolver should first raise keyRemoved and then keyAdded', async () => {
      const cache = new Cache();

      const key = 'some key';

      await cache.add(key, {});

      const addSpy: SinonSpy = spy();
      const removeSpy: SinonSpy = spy();
      cache.keyAdded.subscribe(addSpy);
      cache.keyRemoved.subscribe(removeSpy);

      await cache.add(key, {}, WithinCacheResolvers.KeepNewResolver);

      expect(removeSpy.firstCall.calledBefore(addSpy.firstCall)).to.be.true;
    });

    it('adding with existing key with KeepOldResolver should not raise keyRemoved', async () => {
      const cache = new Cache();

      const key = 'some key';

      await cache.add(key, {});

      const spyCallback: SinonSpy = spy();
      cache.keyRemoved.subscribe(spyCallback);

      await cache.add(key, {}, WithinCacheResolvers.KeepOldResolver);

      expect(spyCallback.callCount).to.be.equal(0);
    });

    it('removing from partition should raise keyRemoved for main cache as well', async () => {
      const key = 'some key';
      const partition = new Cache();
      await partition.add(key, {});

      const cache = new Cache();
      await cache.addCachePartition(partition);

      const keyRemovedSpy = spy();
      cache.keyRemoved.subscribe(keyRemovedSpy);

      await partition.remove(key);

      expect(keyRemovedSpy.callCount).to.be.equal(1);
      expect(keyRemovedSpy.args[0]).to.be.length(1);
      expect(keyRemovedSpy.args[0][0].key).to.be.equal(key);
    });

    it('keyRemoved raised twice from the partition should raise keyRemoved only once', async () => {
      const key = 'some key';
      const partition = new Cache();
      const partitionKeyRemoved = new Subject<CacheKey>();
      stub(partition, 'keyRemoved', { get: () => partitionKeyRemoved });

      const cache = new Cache();
      await cache.addCachePartition(partition);
      await partition.add(key, {});

      const keyRemovedSpy = spy();
      cache.keyRemoved.subscribe(keyRemovedSpy);

      partitionKeyRemoved.next(new CacheKey(key));
      partitionKeyRemoved.next(new CacheKey(key));

      expect(keyRemovedSpy.callCount).to.be.equal(1);
      expect(keyRemovedSpy.args[0]).to.be.length(1);
      expect(keyRemovedSpy.args[0][0].key).to.be.equal(key);
    });

    it('keyRemoved raised from different partition should not raise keyRemoved', async () => {
      const key = 'some key';
      const paartition = new Cache();
      await paartition.add(key, {});

      const otherPartition = new Cache();
      const partitionKeyRemoved = new Subject<CacheKey>();
      stub(otherPartition, 'keyRemoved', { get: () => partitionKeyRemoved });

      const cache = new Cache();
      await cache.addCachePartition(paartition);
      await cache.addCachePartition(otherPartition);

      const keyRemovedSpy = spy();
      cache.keyRemoved.subscribe(keyRemovedSpy);

      partitionKeyRemoved.next(new CacheKey(key));

      expect(keyRemovedSpy.callCount).to.be.equal(0);
    });

    it('removing key should raise key removed with same cache key', async () => {
      const cache = new Cache();

      const key = 'some key';

      const keyAddedSpy: SinonSpy = spy();
      const keyRemovedSpy: SinonSpy = spy();
      cache.keyAdded.subscribe(keyAddedSpy);
      cache.keyRemoved.subscribe(keyRemovedSpy);

      await cache.add(key, {});
      expect(keyAddedSpy.callCount).to.be.equal(1);
      const addedCacheKey: CacheKey = keyAddedSpy.args[0][0];

      await cache.remove(key);
      expect(keyRemovedSpy.callCount).to.be.equal(1);
      const removedCacheKey: CacheKey = keyRemovedSpy.args[0][0];

      expect(removedCacheKey).to.deep.equal(addedCacheKey);
    })
  });

  describe('getInfo', () => {
    it('on emtpy cache should return correct info', async () => {
      const cache = new Cache();

      const info = await cache.getInfo();

      const expectedInfo: CacheInfo = {
        numberOfObjects: 0,
        sizeInBytes: 0
      };
      expect(info).to.be.deep.equal(expectedInfo);
    })

    it('on cache with multiple objects should return correct info', async () => {
      const cache = new Cache();

      const obj1 = { a: 'as', b: 1 };
      const obj2 = { abb: 'as1', bab: true };
      const obj3 = { abbad: null, asd: () => { } };

      await cache.add('key1', obj1);
      await cache.add('key2', obj2);
      await cache.add('key3', obj3);

      const info = await cache.getInfo();

      const totalSize = sizeof(obj1) + sizeof(obj2) + sizeof(obj3);

      const expectedInfo: CacheInfo = {
        numberOfObjects: 3,
        sizeInBytes: totalSize
      };
      expect(info).to.be.deep.equal(expectedInfo);
    })

    it('after removing some objects should return correct info', async () => {
      const cache = new Cache();

      const obj1 = { a: 'as', b: 1 };
      const obj2 = { abb: 'as1', bab: true };
      const obj3 = { abbad: null, asd: () => { } };
      const obj4 = { yjf: 'asd', asghdfh: () => { }, tryewyh: 24 };

      await cache.add('key1', obj1);
      await cache.add('key2', obj2);
      await cache.add('key3', obj3);
      await cache.add('key4', obj4);
      await cache.remove('key3');

      const info = await cache.getInfo();

      const totalSize = sizeof(obj1) + sizeof(obj2) + sizeof(obj4);

      const expectedInfo: CacheInfo = {
        numberOfObjects: 3,
        sizeInBytes: totalSize
      };
      expect(info).to.be.deep.equal(expectedInfo);
    })
  });

  describe('getObjectInfo', () => {
    it('on empty cache should reject', () => {
      const cache = new Cache();

      return expect(cache.getObjectInfo('a')).to.eventually.rejected;
    });

    it('on not existing key should reject', async () => {
      const cache = new Cache();

      await cache.add('some key', {});

      return expect(cache.getObjectInfo('other key')).to.eventually.rejected;
    });

    it('on existing key should return correct info', async () => {
      const cache = new Cache();

      const key = 'some key';
      const obj = { aad: 'safdasdf', saf: 123 };

      const beforeAdd = new Date();

      await cache.add(key, obj);

      const afterAdd = new Date();

      const info = await cache.getObjectInfo(key);

      expect(info.sizeInBytes).to.be.equal(sizeof(obj));
      expect(info.dateAdded.valueOf()).to.be.least(beforeAdd.valueOf());
      expect(info.dateAdded.valueOf()).to.be.most(afterAdd.valueOf());
    });

    it('on existing key should return correct key id', async () => {
      const cache = new Cache();

      const key = 'some key';
      const obj = { aad: 'safdasdf', saf: 123 };

      const keyAddedSpy = spy();
      cache.keyAdded.subscribe(keyAddedSpy);
      await cache.add(key, obj);

      const cacheKey: CacheKey = keyAddedSpy.args[0][0];

      const info = await cache.getObjectInfo(key);

      expect(info.keyId).to.be.equal(cacheKey.keyId);
    });

    it('on existing local key should not getObjectInfo from partition', async () => {
      const partition = new Cache();
      const cache = new Cache();
      await cache.addCachePartition(partition);

      const key = 'some key';
      const obj = { asdasdf: 'adsad' };

      const beforeAdd = new Date();
      await cache.add(key, obj);
      const afterAdd = new Date();

      const partitionGetObjectInfoSpy = spy(partition, 'getObjectInfo');

      const info = await cache.getObjectInfo(key);

      expect(partitionGetObjectInfoSpy.callCount).to.be.equal(0);
      expect(info.sizeInBytes).to.be.equal(sizeof(obj));
      expect(info.dateAdded.valueOf()).to.be.least(beforeAdd.valueOf());
      expect(info.dateAdded.valueOf()).to.be.most(afterAdd.valueOf());
    })

    it('when key is in partition should getObjectInfo from partition', async () => {
      const partition = new Cache();
      const cache = new Cache();
      await cache.addCachePartition(partition);

      const key = 'some key';
      const obj = { asdasdf: 'adsad' };

      const beforeAdd = new Date();
      await partition.add(key, obj);
      const afterAdd = new Date();

      const info = await cache.getObjectInfo(key);

      expect(info.sizeInBytes).to.be.equal(sizeof(obj));
      expect(info.dateAdded.valueOf()).to.be.least(beforeAdd.valueOf());
      expect(info.dateAdded.valueOf()).to.be.most(afterAdd.valueOf());
    })
  });

  describe('addCachePartition', () => {
    let cache: Cache;
    let partition: Cache;
    let resolver: BetweenCachesResolver;
    let resolveResolver: (result: boolean) => void;
    let rejectResolver: (reason: any) => void;

    beforeEach(() => {
      cache = new Cache();
      partition = new Cache();

      resolver = {
        resolve: () => new Promise<boolean>((resolve, reject) => {
          resolveResolver = resolve;
          rejectResolver = reject;
        })
      }
    });

    it('adding multiple partitions should not fail', async () => {
      await cache.addCachePartition(new Cache(), resolver);
      await cache.addCachePartition(new Cache(), resolver);
      await cache.addCachePartition(new Cache(), resolver);
    });

    it('adding partition equal to the cache should fail', async () => {
      return expect(cache.addCachePartition(cache, resolver)).to.eventually.rejected;
    });

    it('adding same partition to the cache should not fail', async () => {
      await cache.addCachePartition(partition, resolver);
      return expect(cache.addCachePartition(partition, resolver)).to.eventually.fulfilled;
    });

    it('fetching by not existing in main cache and partition should reject', async () => {
      await cache.addCachePartition(partition, resolver);

      const key = 'some not existing key';

      return expect(cache.fetch(key)).to.eventually.rejected;
    });

    it('fetching by key existing in main cache should return the object', async () => {
      await cache.addCachePartition(partition, resolver);

      const key = 'some key';
      const obj = {};
      await cache.add(key, obj);

      const result = await cache.fetch(key);

      expect(result).to.be.equal(obj);
    });

    it('add object to partition, add partition, fetching by key existing in partition cache should return the object', async () => {
      const key = 'some key';
      const obj = {};

      await partition.add(key, obj);
      await cache.addCachePartition(partition, resolver);

      const result = await cache.fetch(key);

      expect(result).to.be.equal(obj);
    });

    it('add object to partition, add partitions, fetching by key existing in one of the partitions should return the object', async () => {
      const key = 'some key';
      const obj = {};
      await partition.add(key, obj);

      await cache.addCachePartition(new Cache(), resolver);
      await cache.addCachePartition(partition, resolver);
      await cache.addCachePartition(new Cache(), resolver);

      const result = await cache.fetch(key);

      expect(result).to.be.equal(obj);
    });

    it('add partition, add object to partition, fetching by key existing in partition cache should return the object', async () => {
      const key = 'some key';
      const obj = {};

      await cache.addCachePartition(partition, resolver);
      await partition.add(key, obj);

      const result = await cache.fetch(key);

      expect(result).to.be.equal(obj);
    });

    it('add partitions, add object to partition, fetching by key existing in one of the partitions should return the object', async () => {
      const key = 'some key';
      const obj = {};

      await cache.addCachePartition(new Cache(), resolver);
      await cache.addCachePartition(partition, resolver);
      await cache.addCachePartition(new Cache(), resolver);

      await partition.add(key, obj);

      const result = await cache.fetch(key);

      expect(result).to.be.equal(obj);
    });

    it('add partition, remove object from partition, fetching by removed key should reject', async () => {
      const key = 'some key';
      const obj = {};

      await partition.add(key, obj);
      await cache.addCachePartition(partition, resolver);
      await partition.remove(key);

      return expect(cache.fetch(key)).to.eventually.rejected;
    });

    it('add partitions, remove object from partition, fetching by removed key should reject', async () => {
      const key = 'some key';
      const obj = {};

      await partition.add(key, obj);
      await cache.addCachePartition(new Cache(), resolver);
      await cache.addCachePartition(partition, resolver);
      await cache.addCachePartition(new Cache(), resolver);
      await partition.remove(key);

      return expect(cache.fetch(key)).to.eventually.rejected;
    });

    it('add partition, remove object from partition, fetching by removed key should not fetch from the partition', async () => {
      const key = 'some key';
      const obj = {};

      await partition.add(key, obj);
      await cache.addCachePartition(partition, resolver);
      await partition.remove(key);

      const fetchSpy = spy(partition, 'fetch');

      try {
        await cache.fetch(key);
      } catch (e) {
      }

      expect(fetchSpy.callCount).to.be.equal(0);
    });

    it('add partitions, remove object from partition, fetching by removed key should not fetch from the partition', async () => {
      const key = 'some key';
      const obj = {};

      await partition.add(key, obj);
      await cache.addCachePartition(new Cache(), resolver);
      await cache.addCachePartition(partition, resolver);
      await cache.addCachePartition(new Cache(), resolver);
      await partition.remove(key);

      const fetchSpy = spy(partition, 'fetch');

      try {
        await cache.fetch(key);
      } catch (e) {
      }

      expect(fetchSpy.callCount).to.be.equal(0);
    });

    it('key added raised multiple times in a row for same key from the partition, should not fail', async () => {
      const keyAdded = new Subject<CacheKey>();
      stub(partition, 'keyAdded', { get: () => keyAdded });

      await cache.addCachePartition(partition, resolver);

      const obj = {};
      stub(partition, 'fetch', () => Promise.resolve(obj));

      const key = 'some key';
      keyAdded.next(new CacheKey(key));
      keyAdded.next(new CacheKey(key));

      const result = await cache.fetch(key);
      expect(result).to.be.equal(obj);
    });


    it('key removed raised multiple times in a row for same key from the partition, should not fail', async () => {
      const keyRemoved = new Subject<CacheKey>();
      stub(partition, 'keyRemoved', { get: () => keyRemoved });

      const key = 'some key';
      const obj = {};
      await partition.add(key, obj);
      await cache.addCachePartition(partition, resolver);

      keyRemoved.next(new CacheKey(key));
      keyRemoved.next(new CacheKey(key));

      return expect(cache.fetch(key)).to.eventually.rejected;
    });

    it('fetching from partition fails for some unknown reason, second time should fetch from partition', async () => {
      const key = 'some key';

      const keyAdded = new Subject<CacheKey>();
      stub(partition, 'keyAdded', { get: () => keyAdded });

      const fetchSpy = stub(partition, 'fetch', () => { throw 'some error' });

      await cache.addCachePartition(partition, resolver);
      keyAdded.next(new CacheKey(key));

      try {
        await cache.fetch(key);
      } catch (e) {
      }

      expect(fetchSpy.callCount).to.be.equal(1);

      try {
        await cache.fetch(key);
      } catch (e) {
      }

      expect(fetchSpy.callCount).to.be.equal(2);
    });

    it('fetching from partition fails, second time should not fetch from partition', async () => {
      const keyAdded = new Subject<CacheKey>();
      stub(partition, 'keyAdded', { get: () => keyAdded });

      const fetchSpy = spy(partition, 'fetch');
      await cache.addCachePartition(partition, resolver);

      const key = 'some key';
      keyAdded.next(new CacheKey(key));

      try {
        await cache.fetch(key);
      } catch (e) {
      }

      expect(fetchSpy.callCount).to.be.equal(1, 'should call the first time');

      try {
        await cache.fetch(key);
      } catch (e) {
      }

      expect(fetchSpy.callCount).to.be.equal(1, 'should not call the second time');
    });
  });
});