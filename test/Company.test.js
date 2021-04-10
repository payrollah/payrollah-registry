const { expect } = require("chai").use(require("chai-as-promised"));
const Company = artifacts.require("Company");

const assertCompanyAddedLog = (logs, companyId, companyAddress, domain, name) => {
  expect(logs.event).to.deep.equal("CompanyAdded");
  expect(logs.args[0].toNumber()).to.deep.equal(companyId);
  expect(logs.args[1]).to.deep.equal(companyAddress);
  expect(logs.args[2]).to.deep.equal(domain);
  expect(logs.args[3]).to.deep.equal(web3.utils.keccak256(name));
  expect(logs.args[4]).to.be.true;
};

contract("Company", (accounts) => {
  const platform = accounts[0];
  const company1 = accounts[1];

  const name = "Apple"
  const domain = "apple.com"

  let companyInstance;

  beforeEach(async () => {
    companyInstance = await Company.new("CompanyPayrollah", "CP", {
      from: platform
    });
  });

  describe("createCompany", () => {
    it("should be able to mint new company", async () => {
      const tx = await companyInstance.createCompany(name, domain, {from: company1});
      const companyAddedLog = tx.logs.find(log => log.event === "CompanyAdded");
      let isCompany = await companyInstance.isValidCompanyAddress(company1);
      assertCompanyAddedLog(companyAddedLog, 1, company1, domain, name);
      expect(isCompany).to.be.true;      
    });
  });

  describe("getCompanyAddress", () => {
    beforeEach(async () => {
      await companyInstance.createCompany(name, domain, {from: company1});
    });

    it("should be able to return company address", async () => {
      const address = await companyInstance.getCompanyAddress(1);
      expect(address).to.deep.equal(company1);
    });
  });

  describe("getCompanyIdByAddress", () => {
    beforeEach(async () => {
      await companyInstance.createCompany(name, domain, {from: company1});
    });

    it("should be able to return companyId", async () => {
      const companyId = await companyInstance.getCompanyIdByAddress(company1);
      expect(companyId.toNumber()).to.deep.equal(1);
    });
  });

  describe("isActiveCompany", () => {
    beforeEach(async () => {
      await companyInstance.createCompany(name, domain, {from: company1});
    });

    it("should check if company is active", async () => {
      const isActive = await companyInstance.isActiveCompany(1);
      expect(isActive).to.be.true;
    });

    it("should check if company is inactive", async () => {
      await companyInstance.disableCompany(1, {from: company1});
      const isActive = await companyInstance.isActiveCompany(1);
      expect(isActive).to.be.false;
    });
  });

  describe("isExistingCompany", () => {
    beforeEach(async () => {
      await companyInstance.createCompany(name, domain, {from: company1});
    });

    it("should check if company exist", async () => {
      const isExisting = await companyInstance.isExistingCompany(1);
      expect(isExisting).to.be.true;
    });

    it("should return false if company does not exist", async () => {
      const isExisting = await companyInstance.isExistingCompany(2);
      expect(isExisting).to.be.false;
    });
  });

  describe("isValidCompany", () => {
    beforeEach(async () => {
      await companyInstance.createCompany(name, domain, {from: company1});
    });

    it("should check if company is valid", async () => {
      const isValid = await companyInstance.isValidCompany(1);
      expect(isValid).to.be.true;
    });

    it("should return false if company does not exist", async () => {
      const isValid = await companyInstance.isValidCompany(2);
      expect(isValid).to.be.false;
    });

    it("should return false if company is inactive", async () => {
      await companyInstance.disableCompany(1, {from: company1});
      const isValid = await companyInstance.isValidCompany(1);
      expect(isValid).to.be.false;
    });
  });

  describe("isValidCompanyAddress", () => {
    beforeEach(async () => {
      await companyInstance.createCompany(name, domain, {from: company1});
    });

    it("should check if company is valid", async () => {
      const isValid = await companyInstance.isValidCompanyAddress(company1);
      expect(isValid).to.be.true;
    });

    it("should return false if company does not exist", async () => {
      const isValid = companyInstance.isValidCompanyAddress(platform);
      await expect(isValid).to.be.rejectedWith(
        /VM Exception while processing transaction: revert ERC721Enumerable: owner index out of bounds/
      );
    });

    it("should return false if company is inactive", async () => {
      await companyInstance.disableCompany(1, {from: company1});
      const isValid = await companyInstance.isValidCompanyAddress(company1);
      expect(isValid).to.be.false;
    });
  });

  describe("disableCompany", () => {
    beforeEach(async () => {
      await companyInstance.createCompany(name, domain, {from: company1});
    });

    it("should be able to disable company", async () => {
      await companyInstance.disableCompany(1, {from: company1});
      const isActive = await companyInstance.isActiveCompany(1);
      expect(isActive).to.be.false;
    });

    it("should not be able to disable non-existing companies", async () => {
      const disableError = companyInstance.disableCompany(2);
      await expect(disableError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert company does not exist/
      );
    });

    it("should not be able to disable companies you do not own", async () => {
      const disableError = companyInstance.disableCompany(1);
      await expect(disableError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the owner of the company/
      );
    });

    it("should not be able to disable companies that are already inactive", async () => {
      await companyInstance.disableCompany(1, {from: company1});
      const disableError = companyInstance.disableCompany(1, {from: company1});
      await expect(disableError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert company is not active/
      );
    });
  });
});