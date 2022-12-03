import { ShopError } from 'src/app/core';

interface ProviderError {
  code: number;
  message: string;
  stack: string;
}

function isProviderError(o: any): o is ProviderError {
  o as ProviderError;

  return o.code !== undefined &&
    o.message !== undefined &&
    o.stack !== undefined;
}


export function handleProviderError(err: any): never {
  if (isProviderError(err)) {
    throw new ShopError(err.message);
  } else {
    console.log(err);
    throw new ShopError('Unkown error from wallet provider', err);
  }
}