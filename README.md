# W3shop

Decentralized Webshop.

See https://gitlab.com/minds/web3modal-angular

## How does it work?

- The data of the shop is saved via Ceramic
- The shop creator gets an NFT issued that enables him to control the settings of the shop
- Encrypted file contents are permanently stored in Arweave
- A Smart Contract representing the shop and its content is published to Arbitrum
- When a purchase is made the payment will be collected via the SC and the buyers gets an NFT issued
- Shop Items can be limited or unlimited

### Optional Features

- Pay in different currencies and the PaymentProcessor does an automatic conversion
- Pay a service to pin the Shops Ceramic streams
- Access a shop only if you have a special membership NFT

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
