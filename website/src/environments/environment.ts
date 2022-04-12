// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from "./environment-model";

export const environment: Environment = {
  defaultShopName: 'W3Shop.eth',
  production: false,
  shopFactoryAddr: '0xd11bfA9bBe0F43960FEc4aE5677aE09Cb4059F7a',
  ownerNftArweaveId: 'V3wuc162d70sqxH55qaL8xFMWvDhASGPy7c4XVA3Vqg',
  mockFileUpload: true
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
