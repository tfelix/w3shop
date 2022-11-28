// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from "./environment-model";

export const environment: Environment = {
  defaultShopName: 'W3Shop.eth',
  production: true,
  ownerNftArweaveUri: 'ar://YaVxjOr2aizQMTvofVG26_6LDaMvmFZt2r-elnB9mRQ',
  // TODO this is the prod hash, replace with a one calculated for dev
  initCodeHashW3Shop: '0xbc3e3da31a8b32d9d1af1a403a382959e23543f0fe60e38675928e34f82f69bb',
  mockFileUpload: false,
  mockPayloadEncryption: false
};

