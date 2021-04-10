pragma solidity ^0.5.0;

import "@openzeppelin/contracts/introspection/ERC165.sol";

import "./Task.sol";

contract Job is ERC165 {
    // ERC165: Interface for this contract, can be calculated by calculateTaskERC721Selector()
    // Only append new interface id for backward compatibility
    bytes4 private constant _INTERFACE_ID_TASK = 0xcb9a08f2;

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

    function getTasks() public view returns (uint256[] memory) {
        return tasks;
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
        // Pay the person to who complete the task to unlock the work
        address payable assignee =
            address(uint160(taskRegistry.getAssignee(taskId)));
        assignee.transfer(taskRegistry.getCompensation(taskId));
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
        address oldAssignedTo = taskRegistry.getAssignee(taskId);
        collaborators[newAssignedTo] = true;
        collaborators[oldAssignedTo] = false;
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
        emit JobCompleted(address(this));
    }
}

contract calculateJobSelector {
    // Using only core functions as getter and checker would cause a deep stack
    function calculateSelector() public pure returns (bytes4) {
        Job i;
        return
            i.isJobTask.selector ^
            i.getTasks.selector ^
            i.addTask.selector ^
            i.addCandidates.selector ^
            i.assignTask.selector ^
            i.submitTask.selector ^
            i.approveTask.selector ^
            i.rejectTask.selector ^
            i.reAssignTask.selector ^
            i.completeJob.selector;
    }
}
