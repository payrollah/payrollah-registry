pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";

import "./Worker.sol";

contract Task is ERC721Full {
    uint256 public numTask = 0;
    Worker workerRegistry;

    // ERC165: Interface for this contract, can be calculated by calculateTaskERC721Selector()
    // Only append new interface id for backward compatibility
    bytes4 private constant _INTERFACE_ID_TASK = 0x369077fa;

    constructor(
        string memory name,
        string memory symbol,
        address _workerRegistry
    ) public ERC721Full(name, symbol) {
        _registerInterface(_INTERFACE_ID_TASK);
        workerRegistry = Worker(_workerRegistry);
    }

    struct task {
        string title;
        string description;
        string evidence;
        address assignedTo;
        mapping(address => bool) candidates;
        address endorsedBy;
        bool isComplete;
        uint256 compensation;
    }

    mapping(uint256 => task) public tasks;

    mapping(address => uint256[]) public tasksInProgress;
    mapping(uint256 => uint256) private _taskIndex;

    event TaskCreated(
        uint256 indexed taskId,
        string title,
        string description,
        uint256 compensation
    );
    event TaskAssigned(uint256 indexed taskId, address assignedTo);
    event TaskReAssigned(uint256 indexed taskId, address oldAssignedTo, address newAssignedTo);
    event TaskSubmittedEvidence(uint256 indexed taskId, string evidence);
    event TaskApproved(
        uint256 indexed taskId,
        address indexed assignedTo,
        address endorsedBy
    );
    event EvidenceRejected(
        uint256 indexed taskId,
        address indexed assignedTo,
        address endorsedBy
    );

    modifier onlyOwner(uint256 taskId) {
        require(
            _msgSender() == ownerOf(taskId),
            "caller is not the owner of token"
        );
        _;
    }

    modifier onlyAssignee(uint256 taskId, address assignee) {
        require(
            assignee == tasks[taskId].assignedTo,
            "caller is not assigned person"
        );
        _;
    }

    modifier onlyIsNotAssigned(uint256 taskId) {
        require(isAssigned(taskId) == false, "task not assigned to anyone");
        _;
    }
    modifier onlyValidTask(uint256 taskId) {
        require(isValidTask(taskId), "not a valid taskId");
        _;
    }
    
    modifier onlyHasEvidenceSubmitted(uint256 taskId) {
        require(hasEvidence(taskId), "no evidence submitted currently");
        _;
    }

    modifier onlyRegisteredWorker(address workerAddress) {
        require(
            workerRegistry.isValidWorkerAddress(workerAddress),
            "worker address not registered or inactive"
        );
        _;
    }

    modifier onlyUncompletedTask(uint256 taskId) {
        require(
            !tasks[taskId].isComplete,
            "task has been completed and approved, no more changes can be made"
        );
        _;
    }

    function createTask(
        string memory title,
        string memory description,
        uint256 compensation
    ) public returns (uint256) {
        task memory newTask =
            task(
                title,
                description,
                "",
                address(0),
                address(0),
                false,
                compensation
            );
        uint256 taskId = ++numTask;
        tasks[taskId] = newTask;
        _safeMint(_msgSender(), taskId);
        emit TaskCreated(taskId, title, description, compensation);
        return taskId;
    }

    function isValidTask(uint256 taskId) public view returns (bool) {
        return taskId <= numTask;
    }

    function isCompletedTask(uint256 taskId) public view returns (bool) {
        return tasks[taskId].isComplete;
    }

    function hasEvidence(uint256 taskId) public view returns (bool) {
        bytes memory tempEmptyStringTest = bytes(tasks[taskId].evidence);
        return tempEmptyStringTest.length != 0; 
    }

    function isCandidate(uint256 taskId, address candidate)
        public
        view
        returns (bool)
    {
        return tasks[taskId].candidates[candidate];
    }

    function isAssigned(uint256 taskId) public view returns (bool) {
        return tasks[taskId].assignedTo != address(0);
    }

    function getCompensation(uint256 taskId) public view returns (uint256) {
        return tasks[taskId].compensation;
    }

    function getAssignee(uint256 taskId) public view returns (address) {
        return tasks[taskId].assignedTo;
    }

    function addCandidates(uint256 taskId, address workerAddress)
        public
        onlyValidTask(taskId)
        onlyUncompletedTask(taskId)
        onlyOwner(taskId)
        onlyRegisteredWorker(workerAddress)
    {
        tasks[taskId].candidates[workerAddress] = true;
    }

    function assignTask(uint256 taskId, address assignedTo)
        public
        onlyValidTask(taskId)
        onlyUncompletedTask(taskId)
        onlyIsNotAssigned(taskId)
        onlyOwner(taskId)
    {
        require(
            isCandidate(taskId, assignedTo),
            "workerId is not a candidate for the task"
        );
        tasks[taskId].assignedTo = assignedTo;
        _addTaskIdToWorkerEnumeration(assignedTo, taskId);
        emit TaskAssigned(taskId, assignedTo);
    }

    function submitEvidence(
        uint256 taskId,
        string memory evidence,
        address assignee
    )
        public
        onlyValidTask(taskId)
        onlyUncompletedTask(taskId)
        onlyOwner(taskId)
        onlyAssignee(taskId, assignee)
    {
        tasks[taskId].evidence = evidence;
        emit TaskSubmittedEvidence(taskId, evidence);
    }

    function approveTask(uint256 taskId, address endorsedBy)
        public
        onlyValidTask(taskId)
        onlyUncompletedTask(taskId)
        onlyOwner(taskId)
        onlyHasEvidenceSubmitted(taskId)
    {
        tasks[taskId].endorsedBy = endorsedBy;
        tasks[taskId].isComplete = true;
        _removeTaskIdFromWorkerEnumeration(tasks[taskId].assignedTo, taskId);
        emit TaskApproved(taskId, tasks[taskId].assignedTo, endorsedBy);
    }
    
    function rejectEvidence(uint256 taskId, address endorsedBy)
        public
        onlyValidTask(taskId)
        onlyUncompletedTask(taskId)
        onlyOwner(taskId)
        onlyHasEvidenceSubmitted(taskId)
    {
        tasks[taskId].evidence = "";
        emit EvidenceRejected(taskId, tasks[taskId].assignedTo, endorsedBy);
    }

    function reAssignTask(uint256 taskId, address newAssignedTo)
        public
        onlyValidTask(taskId)
        onlyUncompletedTask(taskId)
        onlyOwner(taskId)
    {
        require(
            newAssignedTo != tasks[taskId].assignedTo,
            "cannot reAssign to same worker"
        );
        require(
            hasEvidence(taskId) == false,
            "cannot reAssign task with pending evidence"
        );
        address oldAssignedTo = tasks[taskId].assignedTo;
        tasks[taskId].assignedTo = address(0);
        _removeTaskIdFromWorkerEnumeration(oldAssignedTo, taskId);
        assignTask(taskId, newAssignedTo);
        emit TaskReAssigned(taskId, oldAssignedTo, newAssignedTo);
    }

    function _addTaskIdToWorkerEnumeration(address assignedTo, uint256 taskId) private {
        _taskIndex[taskId] = tasksInProgress[assignedTo].length;
        tasksInProgress[assignedTo].push(taskId);
    }

    function _removeTaskIdFromWorkerEnumeration(address assignedTo, uint256 taskId) private {
        uint256 lastIndex = tasksInProgress[assignedTo].length.sub(1);
        uint256 index = _taskIndex[taskId];

        // When the token to delete is the last token, the swap operation is unnecessary
        if (index != lastIndex) {
            uint256 lastTaskId = tasksInProgress[assignedTo][lastIndex];
            tasksInProgress[assignedTo][index] = lastTaskId; // Move the last token to the slot of the to-delete token
            _taskIndex[lastTaskId] = index; // Update the moved token's index
        }

        // This also deletes the contents at the last position of the array
        tasksInProgress[assignedTo].length--;
        _taskIndex[taskId] = 0; // remove old taskId index
    }
}

contract calculateTaskERC721Selector {
    function calculateSelector() public pure returns (bytes4) {
        Task i;
        return
            i.createTask.selector ^
            i.isValidTask.selector ^
            i.isCompletedTask.selector ^
            i.isCandidate.selector ^
            i.getCompensation.selector ^
            i.getAssignee.selector ^
            i.getAssignee.selector ^
            i.addCandidates.selector ^
            i.assignTask.selector ^
            i.submitEvidence.selector ^
            i.approveTask.selector;
    }
}
