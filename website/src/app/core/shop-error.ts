export class ShopError extends Error {
  constructor(msg: string, cause?: Error) {
    super(msg);
  }
}