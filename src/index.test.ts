import { stub, SinonStub } from 'sinon';
import { FirstClass } from './index';
import { expect } from 'chai';

describe('first test', () => {
  let obj: FirstClass;

  beforeEach(() => {
    return Promise.resolve('some value')
      .then(_ => console.log(_))
      .then(() => new FirstClass())
      .then(_ => obj = _)
  });

  it('should run', () => {
    const mock: SinonStub = stub(obj, 'doStuff', () => console.log('doin other stuff'));

    obj.doStuff();

    expect(mock.callCount).to.be.equal(1);
  });
});