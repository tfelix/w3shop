export function mapIfNotNull<T, S>(
  value: T | null,
  defaultValue: S,
  fn: (value: T) => S
): S {
  if (value === null) {
    return defaultValue;
  } else {
    return fn(value);
  }
}