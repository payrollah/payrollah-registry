# Payrollah Registry

This repository contains the smart contract code for payrollah registry (in `/contracts`) as well as the node package for using this library (in `/src`).

## Installing Package

```sh
npm i @payrollah/payrollah-registry
```

## Package Usage

This package contains the ABI for the payrollah smart contracts. To use the package, you will need to provide your own Web3 [provider](https://docs.ethers.io/ethers.js/html/api-providers.html) and [signer/wallet](https://docs.ethers.io/ethers.js/html/api-wallet.html).

### Company(ERC721)

Company will store the address, name and domain information of a given company registered with payrollah. You should be connecting to a global instance of Company contract at `0xf9fF6a0Fb432105D1417787fd5a039B02FcFcb78`. 

Connecting to existing Company contract on Ethereum

```ts
import {Company__factory} from "@payrollah/payrollah-registry";

const connectedRegistry = Company__factory.connect(address, wallet);
```

List of available functions on Company

The contract supports [all ERC721 methods](http://erc721.org/) with a few added functionality listed below:

- companies(int `companyId`) - Given companyId return company information
- createCompany(string `name`, string `domain`) - Register new company with Company Contract
- getCompanyAddress(int `companyId`) - Returns company wallet address
- getCompanyIdByAddress(address `companyAddress`) - Get all companyId from Address
- isActiveCompany(int `companyId`) - Check if company isActive
- isExistingCompany(int `companyId`) - Check if company is existing
- isValidCompany(int `companyId`) - Check if company is valid
- isValidCompanyAddress(address `companyAddress`) - Check if company address given is valid
- disableCompany(uint256 `companyId`) - Disable company from smart contract (a way to leave the platform)

### Worker(ERC721)

Worker contract currently just stores the workers address and whether he is active on the platform. We decided to use NFT token here for future scalability in the event that we may want to expand through storing more verification information. You can connect to the Worker contract we have deployed at `0xfC16D162C6a9Ff85346cB42176428c26278F09D1`.

Connecting to existing Worker contract on Ethereum
```ts
import {Worker__factory} from "@payrollah/payrollah-registry";

const connectedRegistry = Worker__factory.connect(address, wallet);
```

List of available functions on Worker contract

The contract supports [all ERC721 methods](http://erc721.org/) with a few added functionality listed below:

- workers(int `workerId`) - Return worker information by id
- createWorker() - Register new worker with Worker contract
- getWorkerAddress(int `workerId`) - Get address from workerId
- getWorkerIdByAddress(address `workerAddress`) - Returns workerId by address
- isActiveWorker(int `workerId`) - Check if the worker account is active
- isExistingWorker(int `workerId`) - Check if the worker exist on the contract
- isValidWorker(int `workerId`) - Check if worker is valid
- isValidWorkerAddress(address `workerAddress`) - Check if given address is a valid worker
- disableWorker(int `workerId`) - Disable worker from smart contract (a way to leave the platform)

## Provider & Signer

Different ways to get provider or signer:

```ts
import {Wallet, providers, getDefaultProvider} from "ethers";

// Providers
const mainnetProvider = getDefaultProvider();
const ropstenProvider = getDefaultProvider("ropsten");
const metamaskProvider = new providers.Web3Provider(web3.currentProvider); // Will change network automatically

// Signer
const signerFromPrivateKey = new Wallet("YOUR-PRIVATE-KEY-HERE", provider);
const signerFromEncryptedJson = Wallet.fromEncryptedJson(json, password);
signerFromEncryptedJson.connect(provider);
const signerFromMnemonic = Wallet.fromMnemonic("MNEMONIC-HERE");
signerFromMnemonic.connect(provider);
```

## Setup

```sh
npm install
npm run test
npm run truffle <command>
```

## Credits

This repo was made for our IS4302 Blockchain and Distributed Ledger Technologies final project!

