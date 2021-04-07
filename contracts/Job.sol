pragma solidity ^0.5.0;

import "@openzeppelin/contracts/introspection/ERC165.sol";

import "./Task.sol";

contract Job is ERC165 {
    // ERC165: Interface for this contract, can be calculated by calculateTaskERC721Selector()
    // Only append new interface id for backward compatibility
    bytes4 private constant _INTERFACE_ID_TASK = 0xde500ce7;

    enum StatusTypes {Created, InProgress, Completed}
    StatusTypes public status = StatusTypes.Created;

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

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4) {
        require(
            msg.sender == address(taskRegistry),
            "only tokens from predefined task registry can be accepted"
        );
        tasks.push(tokenId);
        return
            bytes4(
                keccak256("onERC721Received(address,address,uint256,bytes)")
            );
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

    modifier onlyUncompletedJob() {
        require(
            status != StatusTypes.Completed,
            "Job is already complete, no more changes can be made"
        );
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

    function addTask(
        string memory _title,
        string memory _description,
        uint256 compensation
    ) public payable onlyJobOwner onlyUncompletedJob {
        require(msg.value == compensation, "not enough ethers sent");
        uint256 taskId =
            taskRegistry.createTask(_title, _description, compensation);
    }

    function addCandidates(uint256 taskId)
        public
        onlyUncompletedJob
        onlyJobTask(taskId)
    {
        taskRegistry.addCandidates(taskId, msg.sender);
    }

    function assignTask(uint256 taskId, address assignedTo)
        public
        onlyJobOwner
        onlyUncompletedJob
        onlyJobTask(taskId)
    {
        taskRegistry.assignTask(taskId, assignedTo);
        collaborators[assignedTo] = true;
        status = StatusTypes.InProgress;
    }

    function submitTask(uint256 taskId, string memory evidence)
        public
        onlyUncompletedJob
        onlyCollaborator
    {
        taskRegistry.submitEvidence(taskId, evidence, msg.sender);
    }

    function approveTask(uint256 taskId)
        public
        onlyJobOwner
        onlyUncompletedJob
        onlyJobTask(taskId)
    {
        taskRegistry.approveTask(taskId, msg.sender);
    }
    
    function rejectTask(uint256 taskId)
        public
        onlyJobOwner
        onlyUncompletedJob
        onlyJobTask(taskId)
    {
        taskRegistry.rejectEvidence(taskId, msg.sender);
    }

    function reAssignTask(uint256 taskId, address newAssignedTo)
        public
        onlyJobOwner
        onlyUncompletedJob
        onlyJobTask(taskId)
    {
        taskRegistry.reAssignTask(taskId, newAssignedTo);
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

    function completeJob() public onlyJobOwner onlyUncompletedJob {
        require(_getNumRemainingTask() == 0, "not all task are complete");
        status = StatusTypes.Completed;
        // Pay out to collaborators
        for (uint256 i = 0; i < tasks.length; i++) {
            address payable assignee =
                address(uint160(taskRegistry.getAssignee(tasks[i])));
            assignee.transfer(taskRegistry.getCompensation(tasks[i]));
        }
        emit JobCompleted(address(this));
    }
}
