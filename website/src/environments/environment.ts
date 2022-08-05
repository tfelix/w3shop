// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from "./environment-model";

export const environment: Environment = {
  defaultShopName: 'W3Shop.eth',
  production: false,
  shopFactoryAddr: '0x7E3e552721143977F6c0580b4Cf45d8357C65C1d',
  ownerNftArweaveId: 'V3wuc162d70sqxH55qaL8xFMWvDhASGPy7c4XVA3Vqg',
  mockFileUpload: true,
  mockPayloadEncryption: true
};

