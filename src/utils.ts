export const pick = <T>(props: string[], obj: any): T => {
  let idx = 0;
  let result: Partial<T> = {};
  while (idx < props.length) {
    if (props[idx] in obj) {
      // @ts-ignore
      result[props[idx]] = obj[props[idx]];
    }
    idx += 1;
  }
  return result as T;
};
