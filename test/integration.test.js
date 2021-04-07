const chai = require("chai");
chai.use(require("chai-events"))
const { expect } = chai.use(require("chai-as-promised"));
const should = chai.should();
const EventEmitter = require('events').EventEmitter;
const Company = artifacts.require("Company");
const Job = artifacts.require("Job");
const JobCreator = artifacts.require("JobCreator");
const Task = artifacts.require("Task");
const Worker = artifacts.require("Worker");

contract("Workflow", (accounts) => {
  const platform = accounts[0];
  const company1 = accounts[1];
  const worker1 = accounts[2];
  const worker2 = accounts[3];

  describe("Task Accepted Workflow", () => {
    let companyInstance;
    let jobInstance;
    let jobCreatorInstance;
    let taskInstance;
    let workerInstance;

    before(async () => {
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
      emitter = new EventEmitter();
    });

    it("should be able to register company", async () => {
      await companyInstance.createCompany("Apple", "apple.com", {from: company1});
      let isCompany = await companyInstance.isValidCompanyAddress(company1);
      expect(isCompany).to.be.true;
    });

    it("should be able to register worker", async () => {
      await workerInstance.createWorker({from: worker1});
      await workerInstance.createWorker({from: worker2});
      let isWorker1 = await workerInstance.isValidWorkerAddress(worker1);
      let isWorker2 = await workerInstance.isValidWorkerAddress(worker2);
      expect(isWorker1).to.be.true;
      expect(isWorker2).to.be.true;
    });

    it("should be able to create job", async () => {
      const { logs } = await jobCreatorInstance.deployNewJob("Create new website", "Help our company make something cool", {from: company1});
      jobInstance = await Job.at(logs[0].args.jobAddress);
      const jobOwner = await jobInstance.jobOwner();
      expect(jobOwner).to.be.equal(company1);
    });

    it("should be able to add task", async () => {
      const _title = "UIUX";
      const _description = "I want it to be nice!";
      const value = 10000;
      await jobInstance.addTask(_title, _description, value, {from: company1, value: value});
      let isTask = await taskInstance.isValidTask(1);
      let {title, description, compensation} = await taskInstance.tasks(1);
      expect(isTask).to.be.true;
      expect(title).to.be.equal(_title);
      expect(description).to.be.equal(_description);
      expect(compensation.toNumber()).to.be.equal(value);
      emitter.should.emit("TaskCreated");
    });

    it("should be able to add candidate", async () => {
      await jobInstance.addCandidates(1, {from: worker1});
      await jobInstance.addCandidates(1, {from: worker2});
      let isCandidate1 = await taskInstance.isCandidate(1, worker1);
      let isCandidate2 = await taskInstance.isCandidate(1, worker2);
      expect(isCandidate1).to.be.true;
      expect(isCandidate2).to.be.true;
    });

    it("should be able to assign candidate", async () => {
      await jobInstance.assignTask(1, worker1, {from: company1});
      let assignee = await taskInstance.getAssignee(1);
      expect(assignee).to.be.equal(worker1);
      emitter.should.emit("TaskAssigned");
    });

    it("should be able to submit proof", async () => {
      const _evidence = "www.checkthislink.com"
      await jobInstance.submitTask(1, _evidence, {from: worker1});
      let {evidence} = await taskInstance.tasks(1);
      expect(evidence).to.be.equal(_evidence);
      emitter.should.emit("TaskSubmittedEvidence");
    });
    
    it("should be able to reject proof", async () => {
      await jobInstance.rejectTask(1, {from: company1});
      let {evidence} = await taskInstance.tasks(1);
      expect(evidence).to.be.equal("");
      emitter.should.emit("EvidenceRejected");
    });

    it("should be able to approve task", async () => {
      await jobInstance.submitTask(1, _evidence, {from: worker1});
      let {evidence} = await taskInstance.tasks(1);
      expect(evidence).to.be.equal(_evidence);
      emitter.should.emit("TaskSubmittedEvidence");
      await jobInstance.approveTask(1, {from: company1});
      let {endorsedBy, isComplete} = await taskInstance.tasks(1);
      expect(endorsedBy).to.be.equal(company1);
      expect(isComplete).to.be.true;
      emitter.should.emit("TaskApproved");
    });

    it("should be able to complete job", async () => {
      await jobInstance.completeJob({from: company1});
      let status = await jobInstance.status();
      let balance = await web3.eth.getBalance(jobInstance.address);
      expect(status.toNumber()).to.be.equal(2);
      expect(balance).to.be.equal("0");
    });

    it("should be able to check past task", async () => {
      let contractInstance = new web3.eth.Contract(taskInstance.abi, taskInstance.address);
      const log = await contractInstance.getPastEvents('TaskApproved', {
          filter: {assignedTo: worker1},  
          fromBlock: 0,
          toBlock: 'latest'
      }, (error, events) => { 
        if (!error){ 
          return events;
        }
        else {
          throw new Error(error);
      }});
      expect(log.length).to.be.equal(1);
      expect(log[0].returnValues.taskId).to.be.equal("1");
      expect(log[0].returnValues.endorsedBy).to.be.equal(company1);
      expect(log[0].returnValues.assignedTo).to.be.equal(worker1);
    });

    it("should be able to reassign task", async () => {
      const _title = "Video";
      const _description = "I want it to be 10 minutes long!";
      const value = 10000;
      await jobInstance.addTask(_title, _description, value, {from: company1, value: value});
      let isTask = await taskInstance.isValidTask(1);
      let {title, description, compensation} = await taskInstance.tasks(1);
      expect(isTask).to.be.true;
      expect(title).to.be.equal(_title);
      expect(description).to.be.equal(_description);
      expect(compensation.toNumber()).to.be.equal(value);
      emitter.should.emit("TaskCreated");

      await jobInstance.addCandidates(2, {from: worker1});
      await jobInstance.addCandidates(2, {from: worker2});
      let isCandidate1 = await taskInstance.isCandidate(2, worker1);
      let isCandidate2 = await taskInstance.isCandidate(2, worker2);
      expect(isCandidate1).to.be.true;

      await jobInstance.assignTask(2, worker1, {from: company1});
      let assignee = await taskInstance.getAssignee(2);
      expect(assignee).to.be.equal(worker1);
      emitter.should.emit("TaskAssigned");

      const _evidence2 = "www.badvideolink.com"
      await jobInstance.submitTask(2, _evidence, {from: worker1});
      let {evidence2} = await taskInstance.tasks(2);
      expect(evidence2).to.be.equal(_evidence2);
      emitter.should.emit("TaskSubmittedEvidence");

      await jobInstance.reAssignTask(2, worker2,{from: company1});
      let assignee = await taskInstance.getAssignee(2);
      expect(assignee).to.be.equal(worker2);
      emitter.should.emit("TaskAssigned");
    });
  });
});