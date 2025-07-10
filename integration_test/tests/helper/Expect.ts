export function expect(actual: any, desc?: string) {
  const descPrefix = desc ? `${desc}: ` : '';

  const logPass = (msg: string) => console.log(`${descPrefix}${msg} ✅`);
  const throwErr = (msg: string) => {
    throw new Error(`${descPrefix}${msg} ❌`);
  };

  return {
    toBe(expected: any) {
      if (actual === expected) logPass(`${actual} == ${expected}`);
      else {
        const errorMessage = `Expected ${actual} to be ${expected}`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toNotBe(expected: any) {
      if (actual !== expected) logPass(`${actual} != ${expected}`);
      else {
        const errorMessage = `Expected ${actual} not to be ${expected}`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toEqual(expected: any) {
      if (JSON.stringify(actual) === JSON.stringify(expected))
        logPass(`Expected ${actual} to equal ${expected}`);
      else {
        const errorMessage = `Expected ${actual} to equal ${expected}`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toBeGreaterThan(expected: number) {
      if (actual > expected) logPass(`${actual} > ${expected}`);
      else {
        const errorMessage = `Expected ${actual} to be greater than ${expected}`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toBeGreaterThanOrEqual(expected: number) {
      if (actual >= expected) logPass(`${actual} >= ${expected}`);
      else {
        const errorMessage = `Expected ${actual} to be greater than or equal to ${expected}`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toBeSmallerThan(expected: number) {
      if (actual < expected) logPass(`${actual} < ${expected}`);
      else {
        const errorMessage = `Expected ${actual} to be smaller than ${expected}`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toBeSmallerThanOrEqual(expected: number) {
      if (actual <= expected) logPass(`${actual} <= ${expected}`);
      else {
        const errorMessage = `Expected ${actual} to be smaller than or equal to ${expected}`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toBeTruthy() {
      if (actual) logPass(`${actual} is truthy`);
      else {
        const errorMessage = `Expected ${actual} to be truthy`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toBeFalsy() {
      if (!actual) logPass(`${actual} is falsy`);
      else {
        const errorMessage = `Expected ${actual} to be falsy`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toBeDefined() {
      if (actual !== undefined) logPass(`${actual} is defined`);
      else {
        const errorMessage = `Expected ${actual} to be defined`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toBeUndefined() {
      if (actual === undefined) logPass(`${actual} is undefined`);
      else {
        const errorMessage = `Expected ${actual} to be undefined`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toBeNull() {
      if (actual === null) logPass(`${actual} is null`);
      else {
        const errorMessage = `Expected ${actual} to be null`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toBeNotNull() {
      if (actual !== null) logPass(`${actual} is not null`);
      else {
        const errorMessage = `Expected ${actual} to be not null`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toBeInstanceOf(expected: any) {
      if (actual instanceof expected)
        logPass(`${actual} is instance of ${expected.name}`);
      else {
        const errorMessage = `Expected ${actual} to be instance of ${expected.name}`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toContain(expected: any) {
      if (actual && actual.includes && actual.includes(expected))
        logPass(`${actual} contains ${expected}`);
      else {
        const errorMessage = `Expected ${actual} to contain ${expected}`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toHaveLength(expected: number) {
      if (actual && actual.length === expected)
        logPass(`${actual} has length ${expected}`);
      else {
        const errorMessage = `Expected ${actual} to have length ${expected}, but got ${
          actual ? actual.length : 'undefined'
        }`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toHaveProperty(property: string) {
      if (actual && actual.hasOwnProperty(property))
        logPass(`${actual} has property '${property}'`);
      else {
        const errorMessage = `Expected ${actual} to have property '${property}'`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toHavePropertyValue(property: string, value: any) {
      if (
        actual &&
        actual.hasOwnProperty(property) &&
        actual[property] === value
      ) {
        logPass(`${actual} has property '${property}' with value ${value}`);
      } else {
        const actualValue = actual ? actual[property] : 'undefined';
        const errorMessage = `Expected ${actual} to have property '${property}' with value ${value}, but got ${actualValue}`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toMatchRegex(regex: RegExp) {
      if (regex.test(actual)) logPass(`${actual} matches regex ${regex}`);
      else {
        const errorMessage = `Expected ${actual} to match regex ${regex}`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },

    toBeCloseTo(expected: number, precision: number = 2) {
      const diff = Math.abs(actual - expected);
      const tolerance = Math.pow(10, -precision);
      if (diff <= tolerance)
        logPass(`${actual} is close to ${expected} (precision: ${precision})`);
      else {
        const errorMessage = `Expected ${actual} to be close to ${expected} (precision: ${precision}), but difference is ${diff}`;
        console.error(`[EXPECTATION NOT MET]: ${errorMessage}`);
        throwErr(errorMessage);
      }
    },
  };
}

export default expect;
