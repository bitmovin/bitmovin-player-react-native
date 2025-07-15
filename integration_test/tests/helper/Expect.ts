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
      assert(actual === expected, `Expected ${actual} to be ${expected}`);
    },

    toNotBe(expected: any) {
      assert(actual !== expected, `Expected ${actual} not to be ${expected}`);
    },

    toEqual(expected: any) {
      assert(
        JSON.stringify(actual) === JSON.stringify(expected),
        `Expected ${actual} to equal ${expected}`
      );
    },

    toBeGreaterThan(expected: number) {
      assert(
        actual > expected,
        `Expected ${actual} to be greater than ${expected}`
      );
    },

    toBeGreaterThanOrEqual(expected: number) {
      assert(
        actual >= expected,
        `Expected ${actual} to be greater than or equal to ${expected}`
      );
    },

    toBeSmallerThan(expected: number) {
      assert(
        actual < expected,
        `Expected ${actual} to be smaller than ${expected}`
      );
    },

    toBeSmallerThanOrEqual(expected: number) {
      assert(
        actual <= expected,
        `Expected ${actual} to be smaller than or equal to ${expected}`
      );
    },

    toBeTruthy() {
      assert(actual, `Expected ${actual} to be truthy`);
    },

    toBeFalsy() {
      assert(!actual, `Expected ${actual} to be falsy`);
    },

    toBeDefined() {
      assert(actual !== undefined, `Expected ${actual} to be defined`);
    },

    toBeUndefined() {
      assert(actual === undefined, `Expected ${actual} to be undefined`);
    },

    toBeNull() {
      assert(actual === null, `Expected ${actual} to be null`);
    },

    toBeNotNull() {
      assert(actual !== null, `Expected ${actual} to be not null`);
    },

    toBeInstanceOf(expected: any) {
      assert(
        actual instanceof expected,
        `Expected ${actual} to be instance of ${expected.name}`
      );
    },

    toContain(expected: any) {
      assert(
        actual && actual.includes && actual.includes(expected),
        `Expected ${actual} to contain ${expected}`
      );
    },

    toHaveLength(expected: number) {
      assert(
        actual && actual.length === expected,
        `Expected ${actual} to have length ${expected}, but got ${
          actual ? actual.length : 'undefined'
        }`
      );
    },

    toHaveProperty(property: string) {
      assert(
        actual && actual.hasOwnProperty(property),
        `Expected ${actual} to have property '${property}'`
      );
    },

    toHavePropertyValue(property: string, value: any) {
      const actualValue = actual ? actual[property] : 'undefined';
      assert(
        actual && actual.hasOwnProperty(property) && actual[property] === value,
        `Expected ${actual} to have property '${property}' with value ${value}, but got ${actualValue}`
      );
    },

    toMatchRegex(regex: RegExp) {
      assert(regex.test(actual), `Expected ${actual} to match regex ${regex}`);
    },

    toBeCloseTo(expected: number, precision: number = 2) {
      const diff = Math.abs(actual - expected);
      const tolerance = Math.pow(10, -precision);
      assert(
        diff <= tolerance,
        `Expected ${actual} to be close to ${expected} (precision: ${precision}), but difference is ${diff}`
      );
    },
  };
}

export default expect;
