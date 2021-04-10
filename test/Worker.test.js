const { expect } = require("chai").use(require("chai-as-promised"));
const Worker = artifacts.require("Worker");

const assertWorkerAddedLog = (logs, workerId, workerAddress) => {
  expect(logs.event).to.deep.equal("WorkerAdded");
  expect(logs.args[0].toNumber()).to.deep.equal(workerId);
  expect(logs.args[1]).to.deep.equal(workerAddress);
};

contract("Worker", (accounts) => {
  const platform = accounts[0];
  const worker1 = accounts[1];

  let workerInstance;

  beforeEach(async () => {
    workerInstance = await Worker.new("WorkerPayrollah", "WP", {
      from: platform
    });
  });

  describe("createWorker", () => {
    it("should be able to mint new worker", async () => {
      const tx = await workerInstance.createWorker({from: worker1});
      const workerAddedLog = tx.logs.find(log => log.event === "WorkerAdded");
      let isWorker = await workerInstance.isValidWorkerAddress(worker1);
      assertWorkerAddedLog(workerAddedLog, 1, worker1);
      expect(isWorker).to.be.true;      
    });
  });

  describe("getWorkerAddress", () => {
    beforeEach(async () => {
      await workerInstance.createWorker({from: worker1});
    });

    it("should be able to return worker address", async () => {
      const address = await workerInstance.getWorkerAddress(1);
      expect(address).to.deep.equal(worker1);
    });
  });

  describe("getWorkerIdByAddress", () => {
    beforeEach(async () => {
      await workerInstance.createWorker({from: worker1});
    });


    it("should be able to return workerId", async () => {
      const workerId = await workerInstance.getWorkerIdByAddress(worker1);
      expect(workerId.toNumber()).to.deep.equal(1);
    });
  });

  describe("isActiveWorker", () => {
    beforeEach(async () => {
      await workerInstance.createWorker({from: worker1});
    });

    it("should check if worker is active", async () => {
      const isActive = await workerInstance.isActiveWorker(1);
      expect(isActive).to.be.true;
    });

    it("should check if worker is inactive", async () => {
      await workerInstance.disableWorker(1, {from: worker1});
      const isActive = await workerInstance.isActiveWorker(1);
      expect(isActive).to.be.false;
    });
  });

  describe("isExistingWorker", () => {
    beforeEach(async () => {
      await workerInstance.createWorker({from: worker1});
    });

    it("should check if worker exist", async () => {
      const isExisting = await workerInstance.isExistingWorker(1);
      expect(isExisting).to.be.true;
    });

    it("should return false if worker does not exist", async () => {
      const isExisting = await workerInstance.isExistingWorker(2);
      expect(isExisting).to.be.false;
    });
  });

  describe("isValidWorker", () => {
    beforeEach(async () => {
      await workerInstance.createWorker({from: worker1});
    });

    it("should check if worker is valid", async () => {
      const isValid = await workerInstance.isValidWorker(1);
      expect(isValid).to.be.true;
    });

    it("should return false if worker does not exist", async () => {
      const isValid = await workerInstance.isValidWorker(2);
      expect(isValid).to.be.false;
    });

    it("should return false if worker is inactive", async () => {
      await workerInstance.disableWorker(1, {from: worker1});
      const isValid = await workerInstance.isValidWorker(1);
      expect(isValid).to.be.false;
    });
  });

  describe("isValidWorkerAddress", () => {
    beforeEach(async () => {
      await workerInstance.createWorker({from: worker1});
    });

    it("should check if worker is valid", async () => {
      const isValid = await workerInstance.isValidWorkerAddress(worker1);
      expect(isValid).to.be.true;
    });

    it("should return false if worker does not exist", async () => {
      const isValid = workerInstance.isValidWorkerAddress(platform);
      await expect(isValid).to.be.rejectedWith(
        /VM Exception while processing transaction: revert ERC721Enumerable: owner index out of bounds/
      );
    });

    it("should return false if worker is inactive", async () => {
      await workerInstance.disableWorker(1, {from: worker1});
      const isValid = await workerInstance.isValidWorkerAddress(worker1);
      expect(isValid).to.be.false;
    });
  });

  describe("disableWorker", () => {
    beforeEach(async () => {
      await workerInstance.createWorker({from: worker1});
    });

    it("should be able to disable worker", async () => {
      await workerInstance.disableWorker(1, {from: worker1});
      const isActive = await workerInstance.isActiveWorker(1);
      expect(isActive).to.be.false;
    });

    it("should not be able to disable non-existing workers", async () => {
      const disableError = workerInstance.disableWorker(2);
      await expect(disableError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert worker does not exist/
      );
    });

    it("should not be able to disable worker if not caller", async () => {
      const disableError = workerInstance.disableWorker(1);
      await expect(disableError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the owner of token/
      );
    });

    it("should not be able to disable worker that are already inactive", async () => {
      await workerInstance.disableWorker(1, {from: worker1});
      const disableError = workerInstance.disableWorker(1, {from: worker1});
      await expect(disableError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert worker is not active/
      );
    });
  });
});