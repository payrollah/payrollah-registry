const { expect } = require("chai").use(require("chai-as-promised"));
const Company = artifacts.require("Company");
const Job = artifacts.require("Job");
const JobCreator = artifacts.require("JobCreator");
const Task = artifacts.require("Task");
const Worker = artifacts.require("Worker");

const assertJobDeployedLog = (logs, jobAddress, jobOwner) => {
  expect(logs.event).to.deep.equal("JobDeployed");
  expect(logs.args[0]).to.deep.equal(jobAddress);
  expect(logs.args[1]).to.deep.equal(jobOwner);
};

contract("JobCreator", (accounts) => {
  const platform = accounts[0];
  const company1 = accounts[1];
  const unregisteredCompany1 = accounts[2];

  let companyInstance;
  let jobCreatorInstance;
  let taskInstance;
  let workerInstance;

  const _title = "Testing Job Title";
  const _description = "Testing Description of the Job";

  beforeEach(async () => {
    companyInstance = await Company.new("CompanyPayrollah", "CP", {
      from: platform
    });
    workerInstance = await Worker.new("WorkerPayrollah", "WP", {
      from: platform
    });
    taskInstance = await Task.new("TaskPayrollah", "TP", workerInstance.address, {
      from: platform
    });
    jobCreatorInstance = await JobCreator.new(companyInstance.address, workerInstance.address, taskInstance.address, {
      from: platform
    });
    await companyInstance.createCompany("Apple", "apple.com", {from: company1});
  });

  describe("deployNewJob", () => {
    it("should be able to deploy new job", async () => {
      const tx = await jobCreatorInstance.deployNewJob(_title, _description, {from: company1});
      const jobInstance = await Job.at(tx.logs[0].args.jobAddress);
      const title = await jobInstance.title();
      const description = await jobInstance.description();
      const jobOwner = await jobInstance.jobOwner();
      assertJobDeployedLog(tx.logs[0], jobInstance.address, company1)
      expect(title).to.deep.equal(_title);
      expect(description).to.deep.equal(_description);
      expect(jobOwner).to.be.equal(company1);
    });

    it("should not allow unregistered users to deploy", async () => {
      const deployError = jobCreatorInstance.deployNewJob(_title, _description, {from: unregisteredCompany1});
      await expect(deployError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert ERC721Enumerable: owner index out of bounds/
      );
    });
  });
});