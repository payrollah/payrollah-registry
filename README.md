# Payrollah Registry

This repository contains the smart contract code for payrollah registry (in `/contracts`) as well as the node package for using this library (in `/src`).

## Installing Package

```sh
npm i @payrollah/payrollah-registry
```

## Package Usage

This package contains the ABI for the payrollah smart contracts. To use the package, you will need to provide your own Web3 [provider](https://docs.ethers.io/ethers.js/html/api-providers.html) and [signer/wallet](https://docs.ethers.io/ethers.js/html/api-wallet.html).

### Company(ERC721)

Deploying new Company Contract

```ts
import {Company__factory} from "@payrollah/payrollah-registry";

const factory = new Company__factory(wallet);
const companyInstance = await factory.deploy("COMPANY_ERC721", "CPY");
```

Connecting to existing Company Contract on Ethereum

```ts
import {Company__factory} from "@govtechsg/token-registry";

const connectedRegistry = Company__factory.connect(address, wallet);
```

List of available functions on Company

The contract supports [all ERC721 methods](http://erc721.org/) with a few added functionality listed below:

- companies(int `companyId`) - Given `companyId` return company information
- createCompany(string `name`, string `domain`) - Register new company with Company Contract
- getCompanyAddress(int `companyId`) - Returns company wallet address
- getCompanyIdsByAddress(address `companyAddress`) - get all `companyId`s from Address
- isActiveCompany(int `companyId`) - Check if company isActive
- isExistingCompany(int `companyId`) - Check if company is existing
- isValidCompany(int `companyId`) - Check if company is valid

- isValidCompanyAddress(address `companyAddress`) - Check if company address given is valid
- disableCompany(uint256 companyId) - Disable company from smart contract (a way to leave the platform)



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

