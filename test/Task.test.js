const { expect } = require("chai").use(require("chai-as-promised"));
const Worker = artifacts.require("Worker");
const Task = artifacts.require("Task");

const assertTaskCreatedLog = (logs, taskId, title, description, compensation) => {
  expect(logs.event).to.deep.equal("TaskCreated");
  expect(logs.args[0].toNumber()).to.deep.equal(taskId);
  expect(logs.args[1]).to.deep.equal(title);
  expect(logs.args[2]).to.deep.equal(description);
  expect(logs.args[3].toNumber()).to.deep.equal(compensation);
};

const assertTaskAssignedLog = (logs, taskId, assignedTo) => {
  expect(logs.event).to.deep.equal("TaskAssigned");
  expect(logs.args[0].toNumber()).to.deep.equal(taskId);
  expect(logs.args[1]).to.deep.equal(assignedTo);
};

const assertTaskReAssignedLog = (logs, taskId, oldAssignedTo, newAssignedTo) => {
  expect(logs.event).to.deep.equal("TaskReAssigned");
  expect(logs.args[0].toNumber()).to.deep.equal(taskId);
  expect(logs.args[1]).to.deep.equal(oldAssignedTo);
  expect(logs.args[2]).to.deep.equal(newAssignedTo);
};

const assertTaskSubmittedEvidenceLog = (logs, taskId, evidence) => {
  expect(logs.event).to.deep.equal("TaskSubmittedEvidence");
  expect(logs.args[0].toNumber()).to.deep.equal(taskId);
  expect(logs.args[1]).to.deep.equal(evidence);
};

const assertEventLog = (logs, event, taskId, assignedTo, endorsedBy) => {
  expect(logs.event).to.deep.equal(event);
  expect(logs.args[0].toNumber()).to.deep.equal(taskId);
  expect(logs.args[1]).to.deep.equal(assignedTo);
  expect(logs.args[2]).to.deep.equal(endorsedBy);
};


contract("Task", (accounts) => {
  const platform = accounts[0];
  const worker1 = accounts[1];
  const worker2 = accounts[2];
  const job1 = accounts[3];
  const job2 = accounts[4];
  const unRegisteredWorker = accounts[5];


  let workerInstance;
  let taskInstance;

  const _title = "Testing Task Title";
  const _description = "Testing Description of the Task";
  const _compensation = 10000;
  const _evidence = "Testing evidence";

  const address0 = "0x0000000000000000000000000000000000000000"

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

  describe("createTask", () => {
    it("should be able to mint new task", async () => {
      const tx = await taskInstance.createTask(_title, _description, _compensation, {from: job1});
      const taskCreatedLog = tx.logs.find(log => log.event === "TaskCreated");
      let isValidTask = await taskInstance.isValidTask(1);
      let numTask = await taskInstance.numTask();
      let {title, description, compensation, isComplete} = await taskInstance.tasks(1);
      assertTaskCreatedLog(taskCreatedLog, 1, _title, _description, _compensation);
      expect(isValidTask).to.be.true;  
      expect(numTask.toNumber()).to.deep.equal(1);
      expect(title).to.deep.equal(_title);
      expect(description).to.deep.equal(_description);
      expect(compensation.toNumber()).to.deep.equal(_compensation);
      expect(isComplete).to.be.false;
    });
  });

  describe("isValidTask", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
    });

    it("should check if task exist", async () => {
      const isValid = await taskInstance.isValidTask(1);
      expect(isValid).to.be.true;
    });

    it("should check if task does not exist", async () => {
      const isValid = await taskInstance.isValidTask(2);
      expect(isValid).to.be.false;
    });
  });

  describe("isCompletedTask", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
    });

    it("should check if task is complete", async () => {
      const isCompleted = await taskInstance.isCompletedTask(1);
      expect(isCompleted).to.be.false;
    });

    it("should check if task is complete if completed", async () => {
      await taskInstance.addCandidates(1, worker1, {from: job1});
      await taskInstance.assignTask(1, worker1, {from: job1});
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      await taskInstance.approveTask(1, accounts[6], {from: job1});
      const isCompleted = await taskInstance.isCompletedTask(1);
      expect(isCompleted).to.be.true;
    });
  });

  describe("hasEvidence", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
    });

    it("should check if task has evidence", async () => {
      const hasEvidence = await taskInstance.hasEvidence(1);
      expect(hasEvidence).to.be.false;
    });

    it("should check if task has no evidence", async () => {
      await taskInstance.addCandidates(1, worker1, {from: job1});
      await taskInstance.assignTask(1, worker1, {from: job1});
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      const hasEvidence = await taskInstance.hasEvidence(1);
      expect(hasEvidence).to.be.true;
    });
  });

  describe("isCandidate", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
    });

    it("should check if task has workers as candidate", async () => {
      const isCandidate1 = await taskInstance.isCandidate(1, worker1);
      const isCandidate2 = await taskInstance.isCandidate(1, worker2);
      expect(isCandidate1).to.be.false;
      expect(isCandidate2).to.be.false;
    });

    it("should check if task does not have worker as candidate", async () => {
      await taskInstance.addCandidates(1, worker1, {from: job1});
      const isCandidate1 = await taskInstance.isCandidate(1, worker1);
      const isCandidate2 = await taskInstance.isCandidate(1, worker2);
      expect(isCandidate1).to.be.true;
      expect(isCandidate2).to.be.false;
    });
  });

  describe("isAssigned", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
    });

    it("should check if task is assigned to anyone", async () => {
      const isAssigned = await taskInstance.isAssigned(1);
      expect(isAssigned).to.be.false;
    });

    it("should check if task is assigned to anyone after assigned", async () => {
      await taskInstance.addCandidates(1, worker1, {from: job1});
      await taskInstance.assignTask(1, worker1, {from: job1});
      const isAssigned = await taskInstance.isAssigned(1);
      expect(isAssigned).to.be.true;
    });
  });

  describe("getCompensation", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
    });

    it("should be able to get compensation", async () => {
      const compensation = await taskInstance.getCompensation(1);
      expect(compensation.toNumber()).to.deep.equal(_compensation);
    });
  });

  describe("getAssignee", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
    });

    it("should be able to get assignee", async () => {
      const assignee = await taskInstance.getAssignee(1);
      expect(assignee).to.deep.equal(address0);
    });

    it("should be able to get assignee after assigning", async () => {
      await taskInstance.addCandidates(1, worker1, {from: job1});
      await taskInstance.assignTask(1, worker1, {from: job1});
      const assignee = await taskInstance.getAssignee(1);
      expect(assignee).to.deep.equal(worker1);
    });
  });

  describe("getTaskByJob", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
      await taskInstance.createTask(_title, _description, _compensation, {from: job2});
    });

    it("should be able to get task by job", async () => {
      const tasks1 = await taskInstance.getTaskByJob(job1);
      const tasks2 = await taskInstance.getTaskByJob(job2);
      expect(tasks1[0].toNumber()).to.deep.equal(1);
      expect(tasks1[1].toNumber()).to.deep.equal(2);
      expect(tasks2[0].toNumber()).to.deep.equal(3);
    });
  });

  describe("getTaskByWorkerAddress", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
    });

    it("should be able to get task by worker", async () => {
      await taskInstance.addCandidates(1, worker1, {from: job1});
      await taskInstance.addCandidates(2, worker1, {from: job1});  
      await taskInstance.assignTask(1, worker1, {from: job1});
      await taskInstance.assignTask(2, worker1, {from: job1});
      const tasks = await taskInstance.getTaskByWorkerAddress(worker1);
      expect(tasks.length).to.deep.equal(2);
      expect(tasks[0].toNumber()).to.deep.equal(1);
      expect(tasks[1].toNumber()).to.deep.equal(2);
    });

    it("should only show task in progress", async () => {
      await taskInstance.addCandidates(1, worker1, {from: job1});
      await taskInstance.assignTask(1, worker1, {from: job1});
      const tasksBefore = await taskInstance.getTaskByWorkerAddress(worker1);
      expect(tasksBefore.length).to.deep.equal(1);
      expect(tasksBefore[0].toNumber()).to.deep.equal(1);
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      await taskInstance.approveTask(1, accounts[6], {from: job1});
      const tasksAfter = await taskInstance.getTaskByWorkerAddress(worker1);
      expect(tasksAfter.length).to.deep.equal(0);
    });

  });

  describe("getCandidateByTask", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
      await taskInstance.addCandidates(1, worker1, {from: job1});
      await taskInstance.addCandidates(1, worker2, {from: job1});
    });

    it("should be able to get potential candidate of task", async () => {
      const candidates = await taskInstance.getCandidateByTask(1);
      expect(candidates[0]).to.deep.equal(worker1);
      expect(candidates[1]).to.deep.equal(worker2);
    });
  });

  describe("addCandidates", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
    });

    it("should be to able to add worker as candidate", async () => {
      await taskInstance.addCandidates(1, worker1, {from: job1});
      const candidates = await taskInstance.getCandidateByTask(1);
      const isCandidate1 = await taskInstance.isCandidate(1, worker1);
      expect(candidates[0]).to.deep.equal(worker1);
      expect(isCandidate1).to.be.true;
    });

    it("should not be able to add unregistered worker as candidate", async () => {
      const addCandidatesError = taskInstance.addCandidates(1, unRegisteredWorker, {from: job1});
      await expect(addCandidatesError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert ERC721Enumerable: owner index out of bounds/
      );
    });

    it("should not be able to add worker as candidate to a unowned task", async () => {
      const addCandidatesError = taskInstance.addCandidates(1, worker1, {from: job2});
      await expect(addCandidatesError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the owner of token/
      );
    });

    it("should not be able to add worker as candidate to a invalid task", async () => {
      const addCandidatesError = taskInstance.addCandidates(2, worker1, {from: job2});
      await expect(addCandidatesError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not a valid taskId/
      );
    });

    it("should not be able to assign a task for task which is already complete", async () => {
      await taskInstance.addCandidates(1, worker1, {from: job1});
      await taskInstance.assignTask(1, worker1, {from: job1});
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      await taskInstance.approveTask(1, accounts[6], {from: job1});
      const addCandidatesError = taskInstance.addCandidates(1, worker1, {from: job1});
      await expect(addCandidatesError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert task has been completed and approved, no more changes can be made/
      );
    });
  });

  describe("assignTask", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
      await taskInstance.addCandidates(1, worker1, {from: job1});
      await taskInstance.addCandidates(1, worker2, {from: job1});  
    });

    it("should be to able to assign task", async () => {
      const tx = await taskInstance.assignTask(1, worker1, {from: job1});
      let assignee = await taskInstance.getAssignee(1);
      let tasks = await taskInstance.getTaskByWorkerAddress(worker1);
      expect(assignee).to.be.equal(worker1);
      expect(tasks[0].toNumber()).to.be.equal(1);
      assertTaskAssignedLog(tx.logs[0], 1, worker1);
    });

    it("should not be able to assign task to a unowned task", async () => {
      const assignTaskError = taskInstance.assignTask(1, worker1, {from: job2});
      await expect(assignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the owner of token/
      );
    });

    it("should not be able to assign a task to already assigned task", async () => {
      await taskInstance.assignTask(1, worker1, {from: job1});
      const assignTaskError = taskInstance.assignTask(1, worker1, {from: job1});
      await expect(assignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert task is assigned to someone/
      );
    });

    it("should not be able to assign a task for a invalid task", async () => {
      const assignTaskError = taskInstance.addCandidates(2, worker1, {from: job1});
      await expect(assignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not a valid taskId/
      );
    });

    it("should not be able to assign a task for task which is already complete", async () => {
      await taskInstance.assignTask(1, worker1, {from: job1});
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      await taskInstance.approveTask(1, accounts[6], {from: job1});
      const assignTaskError = taskInstance.assignTask(1, worker1, {from: job1});
      await expect(assignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert task has been completed and approved, no more changes can be made/
      );
    });
  });

  describe("submitEvidence", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
      await taskInstance.addCandidates(1, worker1, {from: job1});
      await taskInstance.assignTask(1, worker1, {from: job1});
    });

    it("should be to able to submit evidence given task", async () => {
      const tx =await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      let {evidence} = await taskInstance.tasks(1);
      const hasEvidence = await taskInstance.hasEvidence(1);
      expect(evidence).to.be.equal(_evidence);
      expect(hasEvidence).to.be.true;
      assertTaskSubmittedEvidenceLog(tx.logs[0], 1, _evidence);
    });

    it("should not be able to submit evidence by non assignee", async () => {
      const submitEvidenceError = taskInstance.submitEvidence(1, _evidence, worker2, {from: job1});
      await expect(submitEvidenceError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not assigned person/
      );
    });

    it("should not be able to submit evidence to a unowned task", async () => {
      const submitEvidenceError = taskInstance.submitEvidence(1, _evidence, worker1, {from: job2});
      await expect(submitEvidenceError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the owner of token/
      );
    });

    it("should not be able to submit evidence for a invalid task", async () => {
      const submitEvidenceError = taskInstance.submitEvidence(2, _evidence, worker1, {from: job1});
      await expect(submitEvidenceError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not a valid taskId/
      );
    });

    it("should not be able to submit evidence for task which is already complete", async () => {
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      await taskInstance.approveTask(1, accounts[6], {from: job1});
      const submitEvidenceError = taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      await expect(submitEvidenceError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert task has been completed and approved, no more changes can be made/
      );
    });
  });

  describe("approveTask", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
      await taskInstance.addCandidates(1, worker1, {from: job1});
      await taskInstance.assignTask(1, worker1, {from: job1});
    });

    it("should be to able to approve given task", async () => {
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      const tx = await taskInstance.approveTask(1, accounts[6], {from: job1});
      let {endorsedBy, isComplete} = await taskInstance.tasks(1);
      let tasks = await taskInstance.getTaskByWorkerAddress(worker1);
      expect(endorsedBy).to.deep.equal(accounts[6]);
      expect(isComplete).to.be.true;
      expect(tasks.length).to.deep.equal(0);
      assertEventLog(tx.logs[0], "TaskApproved", 1, worker1, accounts[6]);
    });

    it("should not be able to approve a task which is already complete", async () => {
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      await taskInstance.approveTask(1, accounts[6], {from: job1});
      const approveTaskError = taskInstance.approveTask(1, job1, {from: job1});
      await expect(approveTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert task has been completed and approved, no more changes can be made/
      );
    });

    it("should not be able to approve a task with no evidence", async () => {
      const approveTaskError = taskInstance.approveTask(1, job1, {from: job1});
      await expect(approveTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert no evidence submitted currently/
      );
    });

    it("should not be able to approve a unowned task", async () => {
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      const approveTaskError = taskInstance.approveTask(1, job1, {from: job2});
      await expect(approveTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the owner of token/
      );
    });

    it("should not be able to approve a invalid task", async () => {
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      const approveTaskError = taskInstance.approveTask(2, job1, {from: job1});
      await expect(approveTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not a valid taskId/
      );
    });
  });

  describe("rejectEvidence", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
      await taskInstance.addCandidates(1, worker1, {from: job1});
      await taskInstance.assignTask(1, worker1, {from: job1});
    });

    it("should be to able to reject evidence for task", async () => {
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      const tx = await taskInstance.rejectEvidence(1, job1, {from: job1});
      let {isComplete, evidence} = await taskInstance.tasks(1);
      let tasks = await taskInstance.getTaskByWorkerAddress(worker1);
      expect(isComplete).to.be.false;
      expect(tasks.length).to.deep.equal(1);
      expect(tasks[0].toNumber()).to.deep.equal(1);
      expect(evidence).to.deep.equal("");
      assertEventLog(tx.logs[0], "EvidenceRejected", 1, worker1, job1);
    });

    it("should not be able to reject evidence for task which is already complete", async () => {
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      await taskInstance.approveTask(1, accounts[6], {from: job1});
      const rejectEvidenceError = taskInstance.rejectEvidence(1, job1, {from: job1});
      await expect(rejectEvidenceError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert task has been completed and approved, no more changes can be made/
      );
    });

    it("should not be able to reject evidence for task with no evidence", async () => {
      const rejectEvidenceError = taskInstance.rejectEvidence(1, job1, {from: job1});
      await expect(rejectEvidenceError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert no evidence submitted currently/
      );
    });

    it("should not be able to reject evidence for a unowned task", async () => {
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      const rejectEvidenceError = taskInstance.rejectEvidence(1, job1, {from: job2});
      await expect(rejectEvidenceError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the owner of token/
      );
    });

    it("should not be able to reject evidence for a invalid task", async () => {
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      const rejectEvidenceError = taskInstance.rejectEvidence(2, job1, {from: job1});
      await expect(rejectEvidenceError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not a valid taskId/
      );
    });
  });

  describe("reAssignTask", () => {
    beforeEach(async () => {
      await taskInstance.createTask(_title, _description, _compensation, {from: job1});
      await taskInstance.addCandidates(1, worker1, {from: job1});
      await taskInstance.addCandidates(1, worker2, {from: job1});
      await taskInstance.assignTask(1, worker1, {from: job1});
    });

    it("should be to able to reassign task", async () => {
      const tx = await taskInstance.reAssignTask(1, worker2, {from: job1});
      let tasks1 = await taskInstance.getTaskByWorkerAddress(worker1);
      let tasks2 = await taskInstance.getTaskByWorkerAddress(worker2);
      let assignee = await taskInstance.getAssignee(1);
      expect(tasks1.length).to.deep.equal(0);
      expect(tasks2.length).to.deep.equal(1);
      expect(tasks2[0].toNumber()).to.deep.equal(1);
      expect(assignee).to.be.equal(worker2);
      assertTaskAssignedLog(tx.logs[0], 1, worker2);
      assertTaskReAssignedLog(tx.logs[1], 1, worker1, worker2);
    });

    it("should not be able to reassign task for task which is already complete", async () => {
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      await taskInstance.approveTask(1, accounts[6], {from: job1});
      const reassignTaskError = taskInstance.reAssignTask(1, worker2, {from: job1});
      await expect(reassignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert task has been completed and approved, no more changes can be made/
      );
    });

    it("should not be able to reassign for task with evidence", async () => {
      await taskInstance.submitEvidence(1, _evidence, worker1, {from: job1});
      const reassignTaskError = taskInstance.reAssignTask(1, worker2, {from: job1});
      await expect(reassignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert cannot reAssign task with pending evidence/
      );
    });

    it("should not be able to reassign for a unowned task", async () => {
      const reassignTaskError = taskInstance.reAssignTask(1, worker2, {from: job2});
      await expect(reassignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert caller is not the owner of token/
      );
    });

    it("should not be able to reassign for a invalid task", async () => {
      const reassignTaskError = taskInstance.reAssignTask(2, worker2, {from: job1});
      await expect(reassignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert not a valid taskId/
      );
    });

    it("should not be able to reassigned to same worker", async () => {
      const reassignTaskError = taskInstance.reAssignTask(1, worker1, {from: job1});
      await expect(reassignTaskError).to.be.rejectedWith(
        /VM Exception while processing transaction: revert cannot reAssign to same worker/
      );
    });
  });
});