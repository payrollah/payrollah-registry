const { expect } = require("chai").use(require("chai-as-promised"));
const Worker = artifacts.require("Worker");
const Task = artifacts.require("Task");
const Job = artifacts.require("Job");

contract("JobCreator", (accounts) => {
  const platform = accounts[0];
  const jobOwner = accounts[1];
  const worker1 = accounts[2];
  const worker2 = accounts[3];

  let workerInstance;
  let taskInstance;

  const _title = "Testing Job Title";
  const _description = "Testing Description of the Job";
  const _value = 10000;
  const _evidence = "test"

  beforeEach(async () => {
    workerInstance = await Worker.new("WorkerPayrollah", "WP", {
      from: platform
    });
    taskInstance = await Task.new("TaskPayrollah", "TP", workerInstance.address, {
      from: platform
    });    
    await workerInstance.createWorker({from: worker1});
    await workerInstance.createWorker({from: worker2});
  });

  describe("constructor", () => {
    it("should be instantiated correctly when deploying new job", async () => {
      const jobInstance = await Job.new(taskInstance.address, jobOwner, _title, _description, {
        from: jobOwner
      });
      const title = await jobInstance.title();
      const description = await jobInstance.description();
      const _jobOwner = await jobInstance.jobOwner();
      expect(title).to.deep.equal(_title);
      expect(description).to.deep.equal(_description);
      expect(jobOwner).to.be.equal(_jobOwner);
    });
  });

  describe("onERC721Received", () => {
    let jobInstance;

    beforeEach(async () => {
      jobInstance = await Job.new(taskInstance.address, jobOwner, _title, _description, {
        from: jobOwner
      });
    });

    it("should add task to tasks when new task are mint", async () => {
      const value = 10000;
      await jobInstance.addTask(_title, _description, value, {from: jobOwner, value: value});
      let tasks = await jobInstance.getTasks();
      expect(tasks.length).to.deep.equal(1);
      expect(tasks[0].toNumber()).to.deep.equal(1);
    });
  });

  describe("isJobTask", () => {
    let jobInstance;

    beforeEach(async () => {
      jobInstance = await Job.new(taskInstance.address, jobOwner, _title, _description, {
        from: jobOwner
      });
    });

    it("should check if job has task", async () => {
      await jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
      let isTask = await jobInstance.isJobTask(1);
      expect(isTask).to.be.true;
    });

    it("should check if job does not have task", async () => {
      let isTask = await jobInstance.isJobTask(2);
      expect(isTask).to.be.false;
    });
  });

  describe("getTasks", () => {
    let jobInstance;

    beforeEach(async () => {
      jobInstance = await Job.new(taskInstance.address, jobOwner, _title, _description, {
        from: jobOwner
      });
    });

    it("should be able to get task by job", async () => {
      let tasks1 = await jobInstance.getTasks();
      await jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
      await jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
      let tasks2 = await jobInstance.getTasks();
      expect(tasks1.length).to.deep.equal(0);
      expect(tasks2.length).to.deep.equal(2);
      expect(tasks2[0].toNumber()).to.deep.equal(1);
      expect(tasks2[1].toNumber()).to.deep.equal(2);
    });

  });

  describe("addTask", () => {
    let jobInstance;

    beforeEach(async () => {
      jobInstance = await Job.new(taskInstance.address, jobOwner, _title, _description, {
        from: jobOwner
      });
    });

    it("should be able to add task", async () => {
      await jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
      let isTask = await jobInstance.isJobTask(1);
      let {title, description, compensation} = await taskInstance.tasks(1);
      expect(isTask).to.be.true;
      expect(title).to.be.equal(_title);
      expect(description).to.be.equal(_description);
      expect(compensation.toNumber()).to.be.equal(_value);
    });

    it("should not be able to add task if not owner", async () => {
      const addTaskError = jobInstance.addTask(_title, _description, _value, {from: worker1, value: _value});
      await expect(addTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the job owner/
      );
    });

    it("should not be able to add task if wrong compensation", async () => {
      const addTaskError = jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: 1000});
      await expect(addTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not enough ethers sent/
      );
    });

    it("should not be able to add task if job completed", async () => {
      await jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
      await jobInstance.addCandidates(1, {from: worker1});
      await jobInstance.assignTask(1, worker1, {from: jobOwner});
      await jobInstance.submitTask(1, _evidence, {from: worker1});
      await jobInstance.approveTask(1, {from: jobOwner});
      await jobInstance.completeJob({from: jobOwner});
      const addTaskError = jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
      await expect(addTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert Job is already complete, no more changes can be made/
      );
    });    
  });

  describe("addCandidates", () => {
    let jobInstance;

    beforeEach(async () => {
      jobInstance = await Job.new(taskInstance.address, jobOwner, _title, _description, {
        from: jobOwner
      });
      await jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
    });

    it("should be able to add candidates", async () => {
      await jobInstance.addCandidates(1, {from: worker1});
      let isCandidate = await taskInstance.isCandidate(1, worker1);
      expect(isCandidate).to.be.true;
    });

    it("should not be able to add candidates if not task of this job", async () => {
      const addCandidatesError = jobInstance.addCandidates(2, {from: jobOwner});
      await expect(addCandidatesError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not valid taskId/
      );
    });

    it("should not be able to add candidate to task if job completed", async () => {
      await jobInstance.addCandidates(1, {from: worker1});
      await jobInstance.assignTask(1, worker1, {from: jobOwner});
      await jobInstance.submitTask(1, _evidence, {from: worker1});
      await jobInstance.approveTask(1, {from: jobOwner});
      await jobInstance.completeJob({from: jobOwner});
      const addCandidatesError = jobInstance.addCandidates(1, {from: worker1});
      await expect(addCandidatesError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert Job is already complete, no more changes can be made/
      );
    });    
  });
  describe("assignTask", () => {
    let jobInstance;

    beforeEach(async () => {
      jobInstance = await Job.new(taskInstance.address, jobOwner, _title, _description, {
        from: jobOwner
      });
      await jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
      await jobInstance.addCandidates(1, {from: worker1});
    });

    it("should be able to assign task", async () => {
      await jobInstance.assignTask(1, worker1, {from: jobOwner});
      let isCollaborator = await jobInstance.collaborators(worker1);
      let status = await jobInstance.status();
      let assignee = await taskInstance.getAssignee(1);
      expect(assignee).to.be.equal(worker1);
      expect(status.toNumber()).to.be.equal(1);
      expect(isCollaborator).to.be.true;
    });

    it("should not be able to assign task if not owner", async () => {
      const assignTaskError = jobInstance.assignTask(1, worker1, {from: worker1});
      await expect(assignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the job owner/
      );
    });

    it("should not be able to assign if not task of this job", async () => {
      const assignTaskError = jobInstance.assignTask(2, worker1, {from: jobOwner});
      await expect(assignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not valid taskId/
      );
    });

    it("should not be able to assign task if job completed", async () => {
      await jobInstance.assignTask(1, worker1, {from: jobOwner});
      await jobInstance.submitTask(1, _evidence, {from: worker1});
      await jobInstance.approveTask(1, {from: jobOwner});
      await jobInstance.completeJob({from: jobOwner});
      const assignTaskError = jobInstance.assignTask(1, worker1, {from: jobOwner});
      await expect(assignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert Job is already complete, no more changes can be made/
      );
    });    
  });

  describe("reAssignTask", () => {
    let jobInstance;

    beforeEach(async () => {
      jobInstance = await Job.new(taskInstance.address, jobOwner, _title, _description, {
        from: jobOwner
      });
      await jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
      await jobInstance.addCandidates(1, {from: worker1});
      await jobInstance.addCandidates(1, {from: worker2});
      await jobInstance.assignTask(1, worker1, {from: jobOwner});
    });

    it("should be able to reassign task", async () => {
      await jobInstance.reAssignTask(1, worker2, {from: jobOwner});
      let isCollaborator1 = await jobInstance.collaborators(worker1);
      let isCollaborator2 = await jobInstance.collaborators(worker2);
      let assignee = await taskInstance.getAssignee(1);
      expect(assignee).to.be.equal(worker2);
      expect(isCollaborator1).to.be.false;
      expect(isCollaborator2).to.be.true;
    });

    it("should not be able to reassign task if not owner", async () => {
      const reassignTaskError = jobInstance.reAssignTask(1, worker2, {from: worker1});
      await expect(reassignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the job owner/
      );
    });

    it("should not be able to reassign if not task of this job", async () => {
      const reassignTaskError = jobInstance.reAssignTask(2, worker2, {from: jobOwner});
      await expect(reassignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not valid taskId/
      );
    });

    it("should not be able to reassign task if job completed", async () => {
      await jobInstance.submitTask(1, _evidence, {from: worker1});
      await jobInstance.approveTask(1, {from: jobOwner});
      await jobInstance.completeJob({from: jobOwner});
      const reassignTaskError = jobInstance.reAssignTask(1, worker2, {from: jobOwner});
      await expect(reassignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert Job is already complete, no more changes can be made/
      );
    });    
  });

  describe("submitTask", () => {
    let jobInstance;

    beforeEach(async () => {
      jobInstance = await Job.new(taskInstance.address, jobOwner, _title, _description, {
        from: jobOwner
      });
      await jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
      await jobInstance.addCandidates(1, {from: worker1});
      await jobInstance.assignTask(1, worker1, {from: jobOwner});
    });

    it("should be able to submit task", async () => {
      await jobInstance.submitTask(1, _evidence, {from: worker1});
      let {evidence} = await taskInstance.tasks(1);
      expect(evidence).to.be.equal(_evidence);
    });

    it("should not be able to submit task if not task of this job", async () => {
      const submitTaskError = jobInstance.submitTask(2, _evidence, {from: worker1});
      await expect(submitTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not valid taskId/
      );
    });

    it("should not be able to submit task if collaborator", async () => {
      const submitTaskError = jobInstance.submitTask(1, _evidence, {from: worker2});
      await expect(submitTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not a collaborator/
      );
    });

    it("should not be able to submit task if job completed", async () => {
      await jobInstance.submitTask(1, _evidence, {from: worker1});
      await jobInstance.approveTask(1, {from: jobOwner});
      await jobInstance.completeJob({from: jobOwner});
      const submitTaskError = jobInstance.submitTask(1, _evidence, {from: worker1});
      await expect(submitTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert Job is already complete, no more changes can be made/
      );
    });    
  });

  describe("approveTask", () => {
    let jobInstance;

    beforeEach(async () => {
      jobInstance = await Job.new(taskInstance.address, jobOwner, _title, _description, {
        from: jobOwner
      });
      await jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
      await jobInstance.addCandidates(1, {from: worker1});
      await jobInstance.assignTask(1, worker1, {from: jobOwner});
      await jobInstance.submitTask(1, _evidence, {from: worker1});
    });

    it("should be able to approve task", async () => {
      await jobInstance.approveTask(1, {from: jobOwner});
      let {endorsedBy, isComplete} = await taskInstance.tasks(1);
      let balance = await web3.eth.getBalance(jobInstance.address);
      expect(endorsedBy).to.be.equal(jobOwner);
      expect(isComplete).to.be.true;
      expect(balance).to.be.equal("0");
    });

    it("should not be able to approve task if not owner", async () => {
      const approveTaskError = jobInstance.approveTask(1, {from: worker1});
      await expect(approveTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the job owner/
      );
    });

    it("should not be able to approve task if not task of this job", async () => {
      const approveTaskError = jobInstance.approveTask(2, {from: jobOwner});
      await expect(approveTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not valid taskId/
      );
    });

    it("should not be able to approve task if job completed", async () => {
      await jobInstance.approveTask(1, {from: jobOwner});
      await jobInstance.completeJob({from: jobOwner});
      const approveTaskError = jobInstance.approveTask(1, {from: jobOwner});
      await expect(approveTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert Job is already complete, no more changes can be made/
      );
    });    
  });
  describe("rejectTask", () => {
    let jobInstance;

    beforeEach(async () => {
      jobInstance = await Job.new(taskInstance.address, jobOwner, _title, _description, {
        from: jobOwner
      });
      await jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
      await jobInstance.addCandidates(1, {from: worker1});
      await jobInstance.assignTask(1, worker1, {from: jobOwner});
      await jobInstance.submitTask(1, _evidence, {from: worker1});
    });

    it("should be able to reject task", async () => {
      await jobInstance.rejectTask(1, {from: jobOwner});
      let {evidence} = await taskInstance.tasks(1);
      expect(evidence).to.be.equal("");
    });

    it("should not be able to reject task if not owner", async () => {
      const rejectTaskError = jobInstance.rejectTask(1, {from: worker1});
      await expect(rejectTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the job owner/
      );
    });

    it("should not be able to reject task if not task of this job", async () => {
      const rejectTaskError = jobInstance.rejectTask(2, {from: jobOwner});
      await expect(rejectTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not valid taskId/
      );
    });

    it("should not be able to reject evidence if job completed", async () => {
      await jobInstance.approveTask(1, {from: jobOwner});
      await jobInstance.completeJob({from: jobOwner});
      const rejectTaskError = jobInstance.rejectTask(1, {from: jobOwner});
      await expect(rejectTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert Job is already complete, no more changes can be made/
      );
    });    
  });

  describe("completeJob", () => {
    let jobInstance;

    beforeEach(async () => {
      jobInstance = await Job.new(taskInstance.address, jobOwner, _title, _description, {
        from: jobOwner
      });
      await jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
      await jobInstance.addCandidates(1, {from: worker1});
      await jobInstance.assignTask(1, worker1, {from: jobOwner});
      await jobInstance.submitTask(1, _evidence, {from: worker1});
      await jobInstance.approveTask(1, {from: jobOwner});
    });

    it("should be able to approve task", async () => {
      await jobInstance.completeJob({from: jobOwner});
      let status = await jobInstance.status();
      let balance = await web3.eth.getBalance(jobInstance.address);
      expect(status.toNumber()).to.be.equal(2);
      expect(balance).to.be.equal("0");
    });

    it("should not be able to complete job if not owner", async () => {
      const completeJobError = jobInstance.completeJob({from: worker1});
      await expect(completeJobError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the job owner/
      );
    });

    it("should not be able to complete job if job completed", async () => {
      await jobInstance.completeJob({from: jobOwner});
      const completeJobError = jobInstance.completeJob({from: jobOwner});
      await expect(completeJobError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert Job is already complete, no more changes can be made/
      );
    });  

    it("should not be able to complete job if not all task are done", async () => {
      await jobInstance.addTask(_title, _description, _value, {from: jobOwner, value: _value});
      const completeJobError = jobInstance.completeJob({from: jobOwner});
      await expect(completeJobError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not all task are complete/
      );
    });
  });
});