import { describe, expect, it } from 'vitest';

import { isAbortError } from './is-abort-error';

describe('isAbortError', () => {
  it('recognises an Error with name AbortError', () => {
    expect(
      isAbortError(Object.assign(new Error('aborted'), { name: 'AbortError' })),
    ).toBe(true);
  });

  it('recognises a non-Error abort object (e.g. a Hermes DOMException)', () => {
    // Deliberately not an Error instance — this is the regression case.
    const domExceptionLike = {
      name: 'AbortError',
      message: 'The operation was aborted',
    };
    expect(domExceptionLike instanceof Error).toBe(false);
    expect(isAbortError(domExceptionLike)).toBe(true);
  });

  it('does not misclassify other errors or nullish values', () => {
    expect(isAbortError(new Error('network down'))).toBe(false);
    expect(isAbortError({ name: 'TypeError' })).toBe(false);
    expect(isAbortError(null)).toBe(false);
    expect(isAbortError(undefined)).toBe(false);
  });
});
