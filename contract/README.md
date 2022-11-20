# W3Shop Contracts

## How to verify the contract

1. Go to `artifacts/contracts/build-info/<UUID>.json` that corresponds to your contract
2. Copy everthing from `input:` property.

```json
  // ...
"solcVersion": "0.8.9",
"solcLongVersion": "0.8.9+commit.e5eed63a",
"input": { // Below this
  "language": "Solidity",
  "sources": {
    // ...
 } // to this
```

3. Create a new JSON file out of it and upload it to the validation website.

### Arbiscan

Setup your API key in `.env` and then use:

```bash
npx hardhat verify --network arbitrumOne DEPLOYED_CONTRACT_ADDRESS
```
