import fastDeepEqual from 'fast-deep-equal';

// Use fast-deep-equal library for robust deep equality comparison
// Handles circular references, Date objects, RegExp, arrays, nested objects, etc.
const deepEqual = fastDeepEqual;

// Type checking utilities
function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

// Enhanced error formatting
function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object Object]';
    }
  }
  return String(value);
}

export function expect(actual: any, desc?: string) {
  const descPrefix = desc ? `${desc}: ` : '';

  const logPass = (msg: string) => console.log(`${descPrefix}${msg} ✅`);
  const throwErr = (msg: string) => {
    throw new Error(`${descPrefix}${msg} ❌`);
  };

  function assert(condition: boolean, message: string) {
    if (condition) logPass(message);
    else {
      console.error(`[EXPECTATION NOT MET]: ${message}`);
      throwErr(message);
    }
  }

  return {
    toBe(expected: any) {
      assert(
        actual === expected,
        `Expected ${formatValue(actual)} to be ${formatValue(expected)}`
      );
    },

    toNotBe(expected: any) {
      assert(
        actual !== expected,
        `Expected ${formatValue(actual)} not to be ${formatValue(expected)}`
      );
    },

    toEqual(expected: any) {
      assert(
        deepEqual(actual, expected),
        `Expected ${formatValue(actual)} to equal ${formatValue(expected)}`
      );
    },

    toBeGreaterThan(expected: number) {
      if (!isNumber(actual) || !isNumber(expected)) {
        throwErr(
          `Both values must be numbers: actual=${formatValue(
            actual
          )}, expected=${formatValue(expected)}`
        );
      }
      assert(
        actual > expected,
        `Expected ${formatValue(actual)} to be greater than ${formatValue(
          expected
        )}`
      );
    },

    toBeGreaterThanOrEqual(expected: number) {
      if (!isNumber(actual) || !isNumber(expected)) {
        throwErr(
          `Both values must be numbers: actual=${formatValue(
            actual
          )}, expected=${formatValue(expected)}`
        );
      }
      assert(
        actual >= expected,
        `Expected ${formatValue(
          actual
        )} to be greater than or equal to ${formatValue(expected)}`
      );
    },

    toBeSmallerThan(expected: number) {
      if (!isNumber(actual) || !isNumber(expected)) {
        throwErr(
          `Both values must be numbers: actual=${formatValue(
            actual
          )}, expected=${formatValue(expected)}`
        );
      }
      assert(
        actual < expected,
        `Expected ${formatValue(actual)} to be smaller than ${formatValue(
          expected
        )}`
      );
    },

    toBeSmallerThanOrEqual(expected: number) {
      if (!isNumber(actual) || !isNumber(expected)) {
        throwErr(
          `Both values must be numbers: actual=${formatValue(
            actual
          )}, expected=${formatValue(expected)}`
        );
      }
      assert(
        actual <= expected,
        `Expected ${formatValue(
          actual
        )} to be smaller than or equal to ${formatValue(expected)}`
      );
    },

    toBeTruthy() {
      assert(actual, `Expected ${formatValue(actual)} to be truthy`);
    },

    toBeFalsy() {
      assert(!actual, `Expected ${formatValue(actual)} to be falsy`);
    },

    toBeDefined() {
      assert(
        actual !== undefined,
        `Expected ${formatValue(actual)} to be defined`
      );
    },

    toBeUndefined() {
      assert(
        actual === undefined,
        `Expected ${formatValue(actual)} to be undefined`
      );
    },

    toBeNull() {
      assert(actual === null, `Expected ${formatValue(actual)} to be null`);
    },

    toBeNotNull() {
      assert(actual !== null, `Expected ${formatValue(actual)} to be not null`);
    },

    toBeInstanceOf(expected: any) {
      assert(
        actual instanceof expected,
        `Expected ${formatValue(actual)} to be instance of ${
          expected.name || 'unknown'
        }`
      );
    },

    toContain(expected: any) {
      assert(
        actual && actual.includes && actual.includes(expected),
        `Expected ${formatValue(actual)} to contain ${formatValue(expected)}`
      );
    },

    toHaveLength(expected: number) {
      const actualLength = actual ? actual.length : undefined;
      assert(
        actual && actual.length === expected,
        `Expected ${formatValue(
          actual
        )} to have length ${expected}, but got ${actualLength}`
      );
    },

    toHaveProperty(property: string) {
      assert(
        actual && Object.prototype.hasOwnProperty.call(actual, property),
        `Expected ${formatValue(actual)} to have property '${property}'`
      );
    },

    toHavePropertyValue(property: string, value: any) {
      const actualValue = actual ? actual[property] : undefined;
      assert(
        actual &&
          Object.prototype.hasOwnProperty.call(actual, property) &&
          actual[property] === value,
        `Expected ${formatValue(
          actual
        )} to have property '${property}' with value ${formatValue(
          value
        )}, but got ${formatValue(actualValue)}`
      );
    },

    toMatchRegex(regex: RegExp) {
      assert(
        regex.test(String(actual)),
        `Expected ${formatValue(actual)} to match regex ${regex}`
      );
    },

    toBeCloseTo(expected: number, precision: number = 2) {
      if (!isNumber(actual) || !isNumber(expected)) {
        throwErr(
          `Both values must be numbers: actual=${formatValue(
            actual
          )}, expected=${formatValue(expected)}`
        );
      }
      const diff = Math.abs(actual - expected);
      const tolerance = Math.pow(10, -precision);
      assert(
        diff <= tolerance,
        `Expected ${formatValue(actual)} to be close to ${formatValue(
          expected
        )} (precision: ${precision}), but difference is ${diff}`
      );
    },

    // Async assertion support
    async toResolve() {
      try {
        const result = await Promise.resolve(actual);
        logPass(`Expected promise to resolve, got: ${formatValue(result)}`);
        return result;
      } catch (error) {
        throwErr(
          `Expected promise to resolve, but it rejected with: ${formatValue(
            error
          )}`
        );
      }
    },

    async toReject() {
      try {
        const result = await Promise.resolve(actual);
        throwErr(
          `Expected promise to reject, but it resolved with: ${formatValue(
            result
          )}`
        );
      } catch (error) {
        logPass(`Expected promise to reject, got: ${formatValue(error)}`);
        return error;
      }
    },

    async toResolveWith(expected: any) {
      try {
        const result = await Promise.resolve(actual);
        assert(
          deepEqual(result, expected),
          `Expected promise to resolve with ${formatValue(
            expected
          )}, but got ${formatValue(result)}`
        );
        return result;
      } catch (error) {
        throwErr(
          `Expected promise to resolve with ${formatValue(
            expected
          )}, but it rejected with: ${formatValue(error)}`
        );
      }
    },

    async toRejectWith(expected: any) {
      try {
        const result = await Promise.resolve(actual);
        throwErr(
          `Expected promise to reject with ${formatValue(
            expected
          )}, but it resolved with: ${formatValue(result)}`
        );
      } catch (error) {
        assert(
          deepEqual(error, expected),
          `Expected promise to reject with ${formatValue(
            expected
          )}, but got ${formatValue(error)}`
        );
        return error;
      }
    },
  };
}

export default expect;
