export class ShopError extends Error {
  constructor(msg: string, cause?: Error) {
    super(msg);
  }
}

export class WalletError extends ShopError {
  constructor(msg: string, cause?: Error) {
    super(msg, cause);
  }
}