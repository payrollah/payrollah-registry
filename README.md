# Payrollah Registry

This repository contains the smart contract code for payrollah registry (in `/contracts`) as well as the node package for using this library (in `/src`).

## Installing Package

```sh
npm i @payrollah/payrollah-registry
```

## Package Usage

This package contains the ABI for the payrollah smart contracts. To use the package, you will need to provide your own Web3 [provider](https://docs.ethers.io/ethers.js/html/api-providers.html) and [signer/wallet](https://docs.ethers.io/ethers.js/html/api-wallet.html).

### Company(ERC721)

Company will store the address, name and domain information of a given company registered with payrollah. You should be connecting to a global instance of Company contract at `0x27a7d618C8d67F8C57eb3eF4815f4C869242B0bE`. 

Connecting to existing Company contract on Ethereum

```ts
import {Company__factory} from "@payrollah/payrollah-registry";

const connectedRegistry = Company__factory.connect(address, wallet);
```

List of available functions on Company

The contract supports [all ERC721 methods](http://erc721.org/) with a few added functionality listed below:

- constructor(string `name`, string `symbol`) - Will be used to initialize the contract
- companies(int `companyId`) - Given companyId return company information
- createCompany(string `name`, string `domain`) - Register new company with Company contract
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

- constructor(string `name`, string `symbol`) - Will be used to initialize the contract
- workers(int `workerId`) - Return worker information by id
- createWorker() - Register new worker with Worker contract
- getWorkerAddress(int `workerId`) - Get address from workerId
- getWorkerIdByAddress(address `workerAddress`) - Returns workerId by address
- isActiveWorker(int `workerId`) - Check if the worker account is active
- isExistingWorker(int `workerId`) - Check if the worker exist on the contract
- isValidWorker(int `workerId`) - Check if worker is valid
- isValidWorkerAddress(address `workerAddress`) - Check if given address is a valid worker
- disableWorker(int `workerId`) - Disable worker from smart contract (a way to leave the platform)

### Task(ERC721)

Task stores all the past task created, who completed it, who endorsed it and its current status. We have decided to make all tasks public for now as we want to allow future company to be able to see the previous work done by worker.
You can connect to the Task contract we have deployed at `0x2fBd0b674B86BBb7Fb7CC76cD815be95eeCcE6c9`.

Connecting to existing Task contract on Ethereum
```ts
import {Task__factory} from "@payrollah/payrollah-registry";

const connectedRegistry = Task__factory.connect(address, wallet);
```

List of available functions on Task contract

The contract supports [all ERC721 methods](http://erc721.org/) with a few added functionality listed below:

- constructor(string `name`, string `symbol`, address `workerRegistry`) - Will be used to initialize the contract
- createTask(string `title`, string `description`, int `compensation`) - Creates a new task instance to be called by Job contract
- isValidTask(int `taskId`) - Checks if the task exist
- isCompletedTask(int `taskId`) - Checks if the task is completed
- hasEvidence(int `taskId`) - Checks if evidence has been submitted before
- isCandidate(int `taskId`, address `candidate`) - Checks if given address is indeed a candidate applying for task
- isAssigned(int `taskId`) - Checks if task is assigned to anyone
- tasks(int `taskId`) - Returns all information about the task
- getCompensation(int `taskId`) - Returns the value of compensation for the task in wei
- getAssignee(int `taskId`) - Returns the assigned address for the task
- getTaskByJob(address `jobAddress`) - Returns an array for all the task owned by job
- getTaskByWorkerAddress(address `workerAddress`) - Returns an array of in-progress task for a given worker address
- getCandidateByTask(int `taskId`) - Returns an array of all potential candidate for a task
- addCandidates(int `taskId`, address `workerAddress`) - Adds a given candidate to a job
- assignTask(int `taskId`, address `assignedTo`) - Assigns a candidate to a given task
- submitEvidence(int `taskId`, string `evidence`,address `assignedTo`) - Allows the candidate to submit evidence via job contract
- approveTask(int `taskId`, address `endorsedBy`) - Allows the job owner to check the evidence and accept the work
- rejectEvidence(int `taskId`, address `endorsedBy`) - Allows the job owner to check the evidence and reject the work
- reAssignTask(int `taskId`, address `assignedTo`) - Allow job owner to reassign the task if worker does not meet standards set

### JobCreator

JobCreator allows us to control who can deploy new jobs. This gives us greater security as we will know exactly who posted a job. You can connect to the JobCreator contract we have deployed at `0xC784727e7dD2689fD25277236E2526d36F907313`.

Connecting to existing JobCreator contract on Ethereum
```ts
import {JobCreator__factory} from "@payrollah/payrollah-registry";

const connectedRegistry = JobCreator__factory.connect(address, wallet);
```

List of available functions on JobCreator contract:

- constructor(address `companyRegistry`, address `workerRegistry`, address `taskRegistry`) - Will be used to initialize the contract
- deployNewJob(string `title`, string `description`) - Deploys a new job contract

### Job

Job is a smart contract which will hold the compensation for all task. It will track the sub task required for the job to be completed. when you use JobCreator to deploy a job, an address will be returned. You can connect to the address of the job.

Connecting to existing Job contract on Ethereum
```ts
import {JobCreator__factory} from "@payrollah/payrollah-registry";

const connectedRegistry = JobCreator__factory.connect(address, wallet);
```

List of available functions on JobCreator contract:

- constructor(address `taskRegistry`, address `jobOwner`, string `title`, string `description`)
- status() - Returns status for job
- tasks(int `index`) - Return task by order of creation
- collaborators(address `workerAddress`) - Check if worker is a collaborator in a job
- jobOwner() - Return owner of job
- title() - Return title of job
- description() - Return description of job
- isJobTask(int `taskId`) - Check if given task is job's task
- getTasks() - Return all task of this job
- addTask(string `title`, string `description`, int `compensation`) - Add task for this job
- addCandidates(int `taskId`, address `workerAddress`) - Adds a given candidate to this job
- assignTask(int `taskId`, address `assignedTo`) - Assigns a candidate to a given task for this job
- submitTask(int `taskId`, string `evidence`) - Allows the candidate to submit evidence for this job
- approveTask(int `taskId`) - Allows the job owner to check the evidence and accept the work for this job
- rejectEvidence(int `taskId`) - Allows the job owner to check the evidence and reject the work
- reAssignTask(int `taskId`, address `assignedTo`) - Allow job owner to reassign the task if worker does not meet standards set for a task in this job
- completeJob() - Allows job owner to complete the task and pay all collaborators

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

