import isNullOrUndefined from './isNullOrUndefined';
import { expect } from 'chai';

describe('isNullOrUndefined', () => {
  it('on null should return true', () => {
    expect(isNullOrUndefined(null)).to.be.true;
  });

  it('on undefined should return true', () => {
    expect(isNullOrUndefined(undefined)).to.be.true;
  });

  it('on 1 should return false', () => {
    expect(isNullOrUndefined(1)).to.be.false;
  });

  it('on 0 should return false', () => {
    expect(isNullOrUndefined(0)).to.be.false;
  });

  it('on empty string should return false', () => {
    expect(isNullOrUndefined('')).to.be.false;
  });

  it('on empty array should return false', () => {
    expect(isNullOrUndefined([])).to.be.false;
  });

  it('on null string should return false', () => {
    expect(isNullOrUndefined('null')).to.be.false;
  });
});