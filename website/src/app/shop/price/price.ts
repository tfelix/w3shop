import { BigNumber } from "ethers";
import { ShopError } from "src/app/core";

export interface Price {
  currency: string;
  amount: BigNumber;
}

export function toPrice(currencyInfo: Required<{ currency: string; price: string }>): Price {
  return {
    currency: currencyInfo.currency,
    amount: BigNumber.from(currencyInfo.price)
  };
}

const allEqual = (arr: any) => arr.every((v: any) => v === arr[0]);

// FIXME this is broken if the array is empty. That can happen. Find a better way
// to work with prices and summing of them.
export function sumPrices(prices: Price[]): Price {
  // Only allow the same currencies to get added up.
  if (prices.length == 0) {
    throw new ShopError('Can not sum empty price arrays');
  }

  if (!allEqual(prices.map(p => p.currency))) {
    throw new ShopError('Not all currencies are equal.');
  }

  const total = [
    BigNumber.from(0),
    ...prices.map(p => p.amount)
  ].reduce((a, b) => a.add(b));

  return {
    currency: prices[0].currency,
    amount: total
  };
}