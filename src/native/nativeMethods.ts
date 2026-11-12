/** Public SDK method signatures are declared only on their public facade. @internal */
export type NativeMethods<Api> = Pick<
  Api,
  {
    [Key in keyof Api]-?: Api[Key] extends (...args: never[]) => unknown
      ? Key
      : never;
  }[keyof Api]
>;
