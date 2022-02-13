# W3Shop [w3shop.eth](https://w3shop.eth.link)

![License](https://img.shields.io/github/license/tfelix/w3shop)

A decentralized, unstoppable Webshop that can be self operated, self hosted and is powered by Blockchain technology.

## Philosophy

NFTs have far more use cases then just for funny Ape pictures. You can use them to control access to digital goods. This webshop has a few principles that should help to make this vision come true:

1. Use cheap and secure infrastructure. This software is L2 first and will focus on implmentations directly on a rollup like Arbitrum.
2. It tries to use decentralized techs that dont require a centralized API like Infura to work. This is not yet 100% archivable but this direction should be taken whenever possible!
3. Ease of use - Setting up the shop must be possible for everyone, not only crypto professionals. As long as you can install a wallet usage of the shop should be possible.
4. Maximal trustlessnes, the shop should be operational without requiring you to host or manage hard- and software.
5. Immutable Contracts where possible

## How does it work?

- The webshop lives in IPFS and is reachable from [w3shop.eth](ipfs://w3shop.eth) or [w3shop.eth.link](https://w3shop.eth.link) (for non ENS and IPFS enabled browsers).
- The user data of the shop is saved via [Ceramic](https://ceramic.network/) and controlled by owning the "Shop-Key" NFT, that is minted when the shop is deployed.
- The digital goods for sale are stored encrypted on Arweave or IPFS.
- Buyers purchase a NFT, representing their access right to this digital content. They can download it and when they rightfully own the NFT the [Lit Protocoll](https://litprotocol.com/) is used to decrypt the digital content.

### Planned Features

- Automatic Currency Conversion: Pay in a currencies and the receiving smart contract does an automatic conversion to the currency the shop owner wants to receive.
- Community goverened shop listing - Imagine a curated list of shops that is indexed and searchable in a decentralized environment
- Access Resitriction: Access a shop only if you have a special membership NFT

## How to use it?

## Development

TODO Describe the quirks of how to get it to run.

### Webpage

The shop software is written with Angular. Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

#### Testing

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

### Contracts

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

### Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/sample-script.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

## Contributers

### Contributing

TODO

Setup https://shields.io/

Name the Shop Template:

* Start Bootstrap - Shop Homepage v5.0.4 (https://startbootstrap.com/template/shop-homepage)
* Copyright 2013-2021 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-shop-homepage/blob/master/LICENSE)
* See https://gitlab.com/minds/web3modal-angular


### Problems

- Jedes Item innerhalb einer Collection bekommt einen eigenen NFT
- IPFS Ordner verändern die CID wenn man später erneut eine Datei hinzufügt. -> IPNS nutzen -> benötigt noch einen Key den wir speichern müssen.
- NFT Daten leben in Arweave oder IPFS und enthalten Informationen über den Shop, Payload URL, Lizenz, Bild usw.
- Payloads der Items leben entweder auf Arweave oder IPFS. Aber Arweave bevorzugt weil das permanent ist.
- Signatur des Owners auf den Root des Merkle Trees der Preise
- Wenn etwas verkauft wird, werden ID + Preise + Root