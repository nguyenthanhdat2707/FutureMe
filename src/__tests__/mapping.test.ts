import { getRequiredString, getOptionalString, getRequiredDate, getOptionalDate, getRequiredNumber, getOptionalNumber, getRequiredBoolean, getOptionalBoolean, getRequiredObject, getOptionalObject, getRequiredArray, getOptionalArray } from '../repositories/dynamo/mapping';

describe('Dynamo mapping utils', () => {
  it('should map required string', () => {
    expect(getRequiredString({ a: 'test' }, 'a')).toBe('test');
    expect(() => getRequiredString({ a: '' }, 'a')).toThrow();
    expect(() => getRequiredString({ a: 123 }, 'a')).toThrow();
  });
  
  it('should map optional string', () => {
    expect(getOptionalString({ a: 'test' }, 'a')).toBe('test');
    expect(getOptionalString({}, 'a')).toBeUndefined();
    expect(() => getOptionalString({ a: 123 }, 'a')).toThrow();
  });

  it('should map required number', () => {
    expect(getRequiredNumber({ a: 123 }, 'a')).toBe(123);
    expect(() => getRequiredNumber({ a: '123' }, 'a')).toThrow();
  });

  it('should map optional number', () => {
    expect(getOptionalNumber({ a: 123 }, 'a')).toBe(123);
    expect(getOptionalNumber({}, 'a')).toBeUndefined();
    expect(() => getOptionalNumber({ a: '123' }, 'a')).toThrow();
  });

  it('should map required boolean', () => {
    expect(getRequiredBoolean({ a: true }, 'a')).toBe(true);
    expect(() => getRequiredBoolean({ a: 'true' }, 'a')).toThrow();
  });

  it('should map optional boolean', () => {
    expect(getOptionalBoolean({ a: true }, 'a')).toBe(true);
    expect(getOptionalBoolean({}, 'a')).toBeUndefined();
    expect(() => getOptionalBoolean({ a: 'true' }, 'a')).toThrow();
  });

  it('should map required date', () => {
    const now = new Date();
    expect(getRequiredDate({ a: now.toISOString() }, 'a').getTime()).toBe(now.getTime());
    expect(() => getRequiredDate({ a: 'invalid' }, 'a')).toThrow();
    expect(() => getRequiredDate({ a: 123 }, 'a')).toThrow();
  });

  it('should map optional date', () => {
    const now = new Date();
    expect(getOptionalDate({ a: now.toISOString() }, 'a')?.getTime()).toBe(now.getTime());
    expect(getOptionalDate({}, 'a')).toBeUndefined();
    expect(() => getOptionalDate({ a: 'invalid' }, 'a')).toThrow();
    expect(() => getOptionalDate({ a: 123 }, 'a')).toThrow();
  });

  it('should map required object', () => {
    expect(getRequiredObject({ a: { b: 1 } }, 'a')).toEqual({ b: 1 });
    expect(getRequiredObject({ a: '{"b":1}' }, 'a')).toEqual({ b: 1 });
    expect(() => getRequiredObject({ a: 'invalid' }, 'a')).toThrow();
    expect(() => getRequiredObject({ a: [] }, 'a')).toThrow();
    expect(() => getRequiredObject({}, 'a')).toThrow();
  });

  it('should map optional object', () => {
    expect(getOptionalObject({ a: { b: 1 } }, 'a')).toEqual({ b: 1 });
    expect(getOptionalObject({ a: '{"b":1}' }, 'a')).toEqual({ b: 1 });
    expect(getOptionalObject({}, 'a')).toBeUndefined();
    expect(() => getOptionalObject({ a: 'invalid' }, 'a')).toThrow();
    expect(() => getOptionalObject({ a: [] }, 'a')).toThrow();
  });

  it('should map required array', () => {
    expect(getRequiredArray({ a: [1] }, 'a')).toEqual([1]);
    expect(getRequiredArray({ a: '[1]' }, 'a')).toEqual([1]);
    expect(() => getRequiredArray({ a: 'invalid' }, 'a')).toThrow();
    expect(() => getRequiredArray({ a: {} }, 'a')).toThrow();
    expect(() => getRequiredArray({}, 'a')).toThrow();
  });

  it('should map optional array', () => {
    expect(getOptionalArray({ a: [1] }, 'a')).toEqual([1]);
    expect(getOptionalArray({ a: '[1]' }, 'a')).toEqual([1]);
    expect(getOptionalArray({}, 'a')).toBeUndefined();
    expect(() => getOptionalArray({ a: 'invalid' }, 'a')).toThrow();
    expect(() => getOptionalArray({ a: {} }, 'a')).toThrow();
  });
});
