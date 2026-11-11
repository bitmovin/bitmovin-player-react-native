/**
 * Preserve the public APIs' detached-callback behavior without per-method wrappers.
 * Each inherited implementation is bound once, before Fabric can freeze the peer.
 * @internal
 */
export function bindNativeMethods(owner: object, prototype: object): void {
  for (
    let current: object | null = prototype;
    current && current !== Object.prototype;
    current = Object.getPrototypeOf(current)
  ) {
    for (const name of Object.getOwnPropertyNames(current)) {
      if (
        name === 'constructor' ||
        name.startsWith('__') ||
        Object.hasOwn(owner, name)
      ) {
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(current, name);
      if (typeof descriptor?.value !== 'function') continue;
      const implementation = Reflect.get(owner, name);
      if (typeof implementation === 'function') {
        Object.defineProperty(owner, name, {
          value: implementation.bind(owner),
          enumerable: true,
          configurable: true,
          writable: true,
        });
      }
    }
  }
}
