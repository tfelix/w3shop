# W3Shop.eth

<p align="center">
  <img width="460" height="300" src="./.github/logo.png">
</p>

![Build Status](https://img.shields.io/github/workflow/status/tfelix/w3shop/Deploy%20Shop/master)
![License](https://img.shields.io/github/license/tfelix/w3shop)

This is a decentralized, unstoppable Webshop that can be self operated, self hosted and is powered by Blockchain technology.

> Check the Dapp under [ipns://w3shop.eth](ipns://w3shop.eth) or [https://w3shop.eth.link](https://w3shop.eth.link)
  (for browser that don't support ENS and IPFS).

## Advantages Over Shop Plattforms

NFTs have far more use cases then just for Ape pictures. You can use them to control access to digital goods and control and
manage ownership. This webshop tries two archive two principles, first it should be as permanent as possible, enabling buyers
to truely posess the digital good, forever, and it should be as easy to use as possible so even non-power users feel
comfortable using it, without requiring to setup payment processors, bank accounts and so on.
This webshop has a few principles that should help to make this vision come true:

1. No payment processor required. No setup of Paypal or Stripe accounts or even bank accounts to sell digital goods.
2. No comission, the smart contracts operate on their own and beside of some fees (which are optimized by using Layer 2
   technology) **all** the proceedings go to you, the content creator.
3. Hosted via chain based infrastructure. You dont require setup, you dont require an own server. All the static information
   that forms the heart of your shop is saved via blockchain based infrastructure. You pay for it, but you own it.
4. Ownership is preserved via Blockchains. You own your shop and decide what happens to it, you can modify, close or even
   sell it to someone else. Similiar to a physical shop.
5. Sustainable: Reduced resource consumption by utilizing Arbitrum L2.
6. Immutable Contracts and permanent storage systems guarantee the accessibility buyers over a long period of time.

## Possible Upcoming Features

These feature are loosly planned without a fixed time table. Its not sure if they work out but they are researched
and part of the vision:

- **Automatic Currency Conversion:** Pay in any currencies and the receiving smart contract does an automatic conversion
  to the currency the shop owner wants to receive.
- **Community Curated Shop Directory:** Imagine a curated list of shops that is indexed and searchable in a
  decentralized environment
- **Limited Shop Items:** (e.g. only 1000 pieces available)
- **Royality NFT Support:** 2nd market revenue generating NFTs (waiting for a ERC standard to mature in order to
  support this use case)
- **Access Restriction:** Access a shop only if you have a special membership NFT

## How to use it?

- The user data of the shop is saved via [Ceramic](https://ceramic.network/) and controlled by owning the "Shop-Key" NFT,
  that is minted when the shop is deployed.
- The digital goods for sale are stored encrypted on Arweave or IPFS.
- Buyers purchase a NFT, representing their access right to this digital content. They can download it and when they
  rightfully own the NFT the [Lit Protocoll](https://litprotocol.com/) is used to decrypt the digital content.

### Create a Shop

TODO Short description on how to use it.

### Sell Digital Content

TODO Short description on how to use it.

### Buy Content

TODO Short description on how to use it.

## Current Risks

Not all components required could or are fully decentralized yet. Here is a list of which part of the code is currently
critical and or if there is a mitigation for it.

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

This project requires two parts, one is the shop application that is found in `website`, the other components are
the underyling smart contracts that are found inside `contract`.

To do proper testing you will need some test Ether on Arbitrum Rinkeby. You can use the
[Rinkeby faucet](https://faucet.rinkeby.io/) (if it is not working you can also try the
[Chainlink Faucet](https://faucets.chain.link/arbitrum-rinkeby) or the [Paradigm Faucet](https://faucet.paradigm.xyz/))
and the [Arbitrum Rinkeby Bridge](https://bridge.arbitrum.io/) (make sure you switch your Metamask
network to Arbitrum Rinkeby).

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

| Contract      | Network          | Address                                                                                                                      |
| ------------- | :--------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| W3ShopFactory | Arbitrum Rinkeby | [0xd11bfA9bBe0F43960FEc4aE5677aE09Cb4059F7a](https://testnet.arbiscan.io/address/0xd11bfA9bBe0F43960FEc4aE5677aE09Cb4059F7a) |
| W3ShopFactory | Arbitrum One     | Not Deployed                                                                                                                 |

### Possible Improvments

The contract side has several possible points of improvements, that could bring down the gas price a lot. Its possible to
have some kind of a single implementation of the ERC-1155 contract and the shop contracts only request a NFT
that they then manage on their own behalf. That saves a lot of otherwise duplicated code, but drives complexity up a lot.

## Contributing

TODO

Setup https://shields.io/

This project uses template inspiration from [Shop Homepage v5.0.4](https://startbootstrap.com/template/shop-homepage).
Licensed under [MIT](https://github.com/StartBootstrap/startbootstrap-shop-homepage/blob/master/LICENSE)
