import { ShopError } from "../core";

export function throwIfMissing(errorMessage: string): never {
  throw new ShopError(errorMessage);
}