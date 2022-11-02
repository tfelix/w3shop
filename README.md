# W3Shop.eth

<p align="center">
  <img width="460" height="300" src="./.github/logo.png">
</p>

![Build Status](https://img.shields.io/github/workflow/status/tfelix/w3shop/Deploy%20Shop/master)
![License](https://img.shields.io/github/license/tfelix/w3shop)

This is a user-friendly, decentralized webshop that can be self operated, self hosted and is powered only by Blockchain technology.

> Access the Dapp under [https://w3shop.eth.link](https://w3shop.eth.link) or ipns://w3shop.eth (for IPFS enabled browsers)

## Features

1. **No payment processor required.** No setup of Paypal or Stripe accounts or even bank accounts to sell or buy digital
   goods.
2. **No comission fees.**. The smart contracts operate on their own and beside gas fees (which are reduced by using
   Layer 2 technology) **all** the proceedings go to the content creator.
3. **Fully hosted via chain based infrastructure.** You don't require an own server. All the static information
   that forms the heart of your shop is saved via blockchain infrastructure. You pay for it, but you own it.
4. **You own your shop.**. You fully decide what happens to your shop. You can modify, close or even
   sell it to someone else. Similiar to a real, physical shop.
5. **Immutable Contracts and permanent storage.** Those systems guarantee the accessibility of data for buyers over a
   long period of time.
6. **Royalty EIP-2981 support**: Digital goods sold via the shop, can signal a royalty fee so the creator can earn
   on secondary market sells.
7. **Limited Items:** Sell a limited amount of items. E.g. only 1000 pieces for your limited edition e-book.

## How to use it?

- The digital goods and user data of the shop is stored encrypted on [Arweave](https://www.arweave.org/) via the
  [Bundlr Network](https://bundlr.network/).
- Buyers purchase a NFT, representing their access right to this digital content. They can download it and when they
  rightfully own the NFT the [Lit Protocoll](https://litprotocol.com/) is used to decrypt the digital content.

### Create a Shop

TODO Short description on how to use it.

### Sell Digital Content

TODO Short description on how to use it.

### Buy Content

TODO Short description on how to use it.

## Upcoming Features

These feature are loosly planned without a fixed time table. Its not sure if they work out but they are researched
and part of the vision:

- **Automatic Currency Conversion:** Pay in any currencies and the receiving smart contract does an automatic conversion
  to the currency the shop owner wants to receive.
- **Community Curated Shop Directory:** Imagine a curated list of shops that is indexed and searchable in a
  decentralized environment.
- **Access Restriction:** Use a shop only if you have a special membership NFT.

Discuss with us in our [Orbis Club Group](https://orbis.club/group/kjzl6cwe1jw148g91hce2elv8hiktmbs2bppox00qtenvu1k73jlqa7yxmle7e0)
about your favorite (or even new ideas).

## Current Risks

Not all components required could or are fully decentralized yet. Here is a list of which part of the code is currently
critical and/or if there is a mitigation for this risk.

| Component                            |                                                                                                                                                                                                                                                                                                   Description | Mitigation                                                                                                                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ENS w3shop.eth.link                  |                                                                                                                                                                                                                                                 This is a DNS resolved IPFS gateway that could be taken down. | You can use a IPFS enabled browser or an addon like Metamask to directly resolve w3shop.eth instead.                                                                                                                                                 |
| IPFS hosting of the Shop             | The shop is only hosted on one IPFS node. If this node goes down the shop will be inaccsible. You can help to secure the shop code by pinning it on your own IPFS node. Also the releases from Github can be used to start up an IPFS node with the code of the shop so it will be available again worldwide. | The shop uses IPNS to resolve the underlying IPFS hash. So redeploying the code would not make it accessible on the same domain again immediatly. However internally the shop uses IPFS hashes for resolution so loosing the ENS would not be fatal. |
| Lit Protocol for content decryption  |                                                                                                                The protocol is in alpha stage and its unclear if it will be there forever or a critical flaw will be found. For more information check their page [litprotocol.com](https://litprotocol.com/) | -                                                                                                                                                                                                                                                    |
| Arweave Gatways for fetching content |                                                                                                                                                                 Arweave uses gateways like `https://arweave.net/<CONTENT_ID>` in order to fetch the saved content. This is based on the classical DNS system. | You can start your own Arweave gateway. Soon there will be support in the Dapp to point Arweave URLs against a custom gateway.                                                                                                                       |
| Ceramic                              |                                                                                                                                                                                                                                         Alpha phase and in testnet. Currently unclear if its required at all. | -                                                                                                                                                                                                                                                    |
| Bundlr Network for content upload    |                                                                                                                                                                           Could go offline and is currently centralized and in alpha phase. It currently also uses only two nodes that are reachable via DNS. | -                                                                                                                                                                                                                                                    |
| Arbitrum                             |                                                                                                                                    Currently Arbitrum is in beta phase and still can be stopped via their team. Its also not fully decentralized yet so in theory manipulation is possible. Use with caution. | -                                                                                                                                                                                                                                                    |

## Development

This project requires two parts, one is the shop application that is found in `/website`, the other components are
the underyling smart contracts that are found inside `/contract`.

To do proper testing you will need some test Ether on Arbitrum Rinkeby. You can use the
[Rinkeby faucet](https://faucet.rinkeby.io/) (if it is not working you can also try the
[Chainlink Faucet](https://faucets.chain.link/arbitrum-rinkeby) or the [Paradigm Faucet](https://faucet.paradigm.xyz/))
and the [Arbitrum Rinkeby Bridge](https://bridge.arbitrum.io/) to transfer those ETH to the test Arbitrum (make sure
you switch your Metamaskn network to Arbitrum Rinkeby).

### Webpage

The shop software is written with Angular. In order to start local developing right away do the following after you checked
out the repository:

```shell
cd website
npm run start
```

This sets up a environment where all key components that interact with chain or external infrastructure are mocked. So
you don't need any requirements other then an installed Metamask wallet.

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.
In case you want to access an example shop you can to to `http://localhost:4200/a2p6bDZmZGR1YjloeGYycTMxMmE1cWp0OXJhM295emI3bHRoc3J0d2huZTB3dTU0aXV2ajg1MmJ3OXd4ZnZz`.

There are other helpful commands to unit test via [Karma](https://karma-runner.github.io) or run the End 2 End tests:

```shell
npm run test # Unit tests
npm run e2e # End 2 End tests
```

### Contracts

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and
an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other
tools, preconfigured to work with the project code.

| Contract                     | Network        | Address                                                                                                                                     |
| ---------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| W3ShopFactory                | Arbitrum Görli | [0x675473D182788a1F8Af5F18FB2b3Cf288AC6AdB6](https://goerli-rollup-explorer.arbitrum.io/address/0x675473D182788a1F8Af5F18FB2b3Cf288AC6AdB6) |
| W3PaymentProcessor (Default) | Arbitrum Görli | [0x770F45F00e629E58D88CED68F2D0d43a214D9ce1](https://goerli-rollup-explorer.arbitrum.io/address/0x770F45F00e629E58D88CED68F2D0d43a214D9ce1) |
| W3ShopFactory                | Arbitrum One   | Not Deployed Yet                                                                                                                            |
| W3PaymentProcessor (Default) | Arbitrum One   | Not Deployed Yet                                                                                                                            |

## Contributing

This project is created only in my spare time. Feel free to open PR for improvements you would like to see! Any help is welcomed
here.

This project uses template inspiration from [Shop Homepage v5.0.4](https://startbootstrap.com/template/shop-homepage).
Licensed under [MIT](https://github.com/StartBootstrap/startbootstrap-shop-homepage/blob/master/LICENSE)
