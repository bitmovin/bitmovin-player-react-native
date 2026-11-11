/** Promote an SDK-returned peer without copying its native state or creating another SDK object. @internal */
export function adoptNative<T extends object, Public extends T>(
  native: T,
  prototype: Public,
  initialize: (owner: Public) => void
): Public {
  if (!prototype.isPrototypeOf(native)) {
    if (!Object.isExtensible(native))
      throw new Error(
        'Cannot adopt a frozen native object. Adopt it before freezing or passing it to a native view.'
      );
    Object.setPrototypeOf(native, prototype);
  }
  const owner = native as Public;
  initialize(owner);
  return owner;
}
