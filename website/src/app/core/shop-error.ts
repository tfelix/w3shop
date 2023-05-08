export class ShopError extends Error {
  constructor(msg: string, public override cause?: Error) {
    super(msg);
  }

  getCauseMessage(): string {
    if (this.cause && this.cause.message) {
      return this.cause.message;
    } else {
      return this.message;
    }
  }
}

export class WalletError extends ShopError {
  constructor(msg: string, cause?: Error) {
    super(msg, cause);
  }
}