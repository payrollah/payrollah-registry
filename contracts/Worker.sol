pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";

contract Worker is ERC721Full {
    
    // ERC165: Interface for this contract, can be calculated by calculateTaskERC721Selector()
    // Only append new interface id for backward compatibility
    bytes4 private constant _INTERFACE_ID_TASK = 0x2df483f1;
    
    uint256 public numWorker = 0;

    constructor(string memory name, string memory symbol)
        public
        ERC721Full(name, symbol)
    {
         _registerInterface(_INTERFACE_ID_TASK);
    }

    struct worker {
        address workerAddress;
        bool isActive;
    }

    mapping(uint256 => worker) public workers;

    event WorkerAdded(uint256 indexed workerId, address indexed workerAddress);

    modifier onlyOwner(uint256 workerId) {
        require(
            msg.sender == ownerOf(workerId),
            "caller is not the owner of token"
        );
        _;
    }

    modifier onlyExistingWorker(uint256 workerId) {
        require(isExistingWorker(workerId), "worker does not exist");
        _;
    }

    modifier onlyActiveWorker(uint256 workerId) {
        require(isActiveWorker(workerId), "worker is not active");
        _;
    }

    function createWorker() public returns (uint256) {
        worker memory newWorker = worker(_msgSender(), true);
        uint256 workerId = ++numWorker;
        workers[workerId] = newWorker;
        _safeMint(_msgSender(), workerId);
        emit WorkerAdded(workerId, _msgSender());
        return workerId;
    }

    function getWorkerAddress(uint256 workerId) public view returns (address) {
        return workers[workerId].workerAddress;
    }

    function getWorkerIdByAddress(address workerAddress)
        public
        view
        returns (uint256)
    {
        return tokenOfOwnerByIndex(workerAddress, 0);
    }

    function isActiveWorker(uint256 workerId) public view returns (bool) {
        return workers[workerId].isActive;
    }

    function isExistingWorker(uint256 workerId) public view returns (bool) {
        return getWorkerAddress(workerId) != address(0);
    }

    function isValidWorker(uint256 workerId) public view returns (bool) {
        return isActiveWorker(workerId) && isExistingWorker(workerId);
    }

    function isValidWorkerAddress(address workerAddress)
        public
        view
        returns (bool)
    {
        uint256 workerId = getWorkerIdByAddress(workerAddress);
        return isActiveWorker(workerId) && isExistingWorker(workerId);
    }

    function disableWorker(uint256 workerId)
        public
        onlyExistingWorker(workerId)
        onlyOwner(workerId)
        onlyActiveWorker(workerId)
    {
        workers[workerId].isActive = false;
    }
}

contract calculateWorkerERC721Selector {
    // Using only core functions as getter and checker would cause a deep stack
    function calculateSelector() public pure returns (bytes4) {
        Worker i;
        return
            i.createWorker.selector ^
            i.getWorkerAddress.selector ^
            i.getWorkerIdByAddress.selector ^
            i.isActiveWorker.selector ^
            i.isExistingWorker.selector ^
            i.isValidWorker.selector ^
            i.isValidWorkerAddress.selector ^
            i.disableWorker.selector;
    }
}
