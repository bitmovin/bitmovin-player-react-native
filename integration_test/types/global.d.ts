declare global {
  namespace JSX {
    interface Element {}
    interface ElementClass {}
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }

  function expect(actual: any): {
    toBeDefined(): void;
    toBeUndefined(): void;
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toContain(item: any): void;
    toMatch(regexp: RegExp): void;
    toThrow(error?: any): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledWith(...args: any[]): void;
    toHaveBeenCalledTimes(times: number): void;
    toBeCloseTo(number: number, numDigits?: number): void;
    toBeGreaterThan(number: number): void;
    toBeGreaterThanOrEqual(number: number): void;
    toBeLessThan(number: number): void;
    toBeLessThanOrEqual(number: number): void;
    toBeInstanceOf(constructor: any): void;
    toHaveLength(length: number): void;
    toHaveProperty(property: string, value?: any): void;
    not: any;
  };
}

export {};
