pragma solidity ^0.5.0;

import "@openzeppelin/contracts/introspection/ERC165.sol";

import "./Task.sol";

contract Job is ERC165 {
    // ERC165: Interface for this contract, can be calculated by calculateTaskERC721Selector()
    // Only append new interface id for backward compatibility
    bytes4 private constant _INTERFACE_ID_TASK = 0xde500ce7;

    enum StatusTypes {Uninitialised, InProgress, Completed}
    StatusTypes public status = StatusTypes.Uninitialised;

    // Information on task
    Task public taskRegistry;
    uint256[] public tasks;

    // Information on Job
    mapping(address => bool) public collaborators;
    address public jobOwner;
    string public title;
    string public description;

    constructor(
        Task _taskRegistry,
        address _jobOwner,
        string memory _title,
        string memory _description
    ) public {
        taskRegistry = Task(_taskRegistry);
        jobOwner = _jobOwner;
        title = _title;
        description = _description;
        _registerInterface(_INTERFACE_ID_TASK);
    }

    modifier onlyJobOwner() {
        require(msg.sender == jobOwner, "caller is not the job owner");
        _;
    }

    modifier onlyJobTask(uint256 taskId) {
        require(isJobTask(taskId), "not valid taskId");
        _;
    }

    modifier onlyCollaborator() {
        require(collaborators[msg.sender], "caller is not a collaborator");
        _;
    }

    event JobCompleted(address indexed jobAddress);

    function isJobTask(uint256 taskId) public view returns (bool) {
        for (uint256 i = 0; i < tasks.length; i++) {
            if (tasks[i] == taskId) {
                return true;
            }
        }
    }

    function addTask(string memory _title, string memory _description)
        public
        onlyJobOwner
    {
        uint256 taskId = taskRegistry.createTask(_title, _description);
        tasks.push(taskId);
    }

    function addCandidates(uint256 taskId) public onlyJobTask(taskId) {
        taskRegistry.addCandidates(taskId, msg.sender);
    }

    function assignTask(uint256 taskId, address assignedTo)
        public
        onlyJobOwner
        onlyJobTask(taskId)
    {
        taskRegistry.assignTask(taskId, assignedTo);
        collaborators[msg.sender] = true;
        status = StatusTypes.InProgress;
    }

    function submitTask(uint256 taskId, string memory evidence)
        public
        onlyCollaborator
    {
        taskRegistry.submitEvidence(taskId, evidence, msg.sender);
    }

    function approveTask(uint256 taskId)
        public
        onlyJobOwner
        onlyJobTask(taskId)
    {
        taskRegistry.approveTask(taskId, msg.sender);
    }

    function _getNumRemainingTask() internal view returns (uint256) {
        uint256 remainingTask = 0;
        for (uint256 i = 0; i < tasks.length; i++) {
            if (!taskRegistry.isCompletedTask(tasks[i])) {
                remainingTask++;
            }
        }
        return remainingTask;
    }

    function completeJob() public onlyJobOwner {
        require(_getNumRemainingTask() == 0, "not all task are complete");
        status = StatusTypes.Completed;
        // payout?
        emit JobCompleted(address(this));
    }
}
