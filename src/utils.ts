type RemoveOn<S extends string> = S extends `on${infer R}`
  ? Uncapitalize<R>
  : never;

export type CamelCaseToKebabCase<S extends string> =
  S extends `${infer F}${infer R}`
    ? F extends Lowercase<F>
      ? `${F}${CamelCaseToKebabCase<R>}`
      : `-${Lowercase<F>}${CamelCaseToKebabCase<R>}`
    : Lowercase<S>;

export const camelCaseToKebabCase = (value: string): string => {
  return (
    (value[0] ?? "").toLowerCase() +
    value.slice(1).replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
  );
};

export type JsxPropNameToEventName<S extends string> = CamelCaseToKebabCase<
  RemoveOn<S>
>;

export const jsxPropNameToEventName = (value: `on${string}`): string => {
  if (value.startsWith("on:")) {
    return value.slice(3);
  } else {
    return camelCaseToKebabCase(value.slice(2));
  }
};
