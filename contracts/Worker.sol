pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";

contract Worker is ERC721Full {
    uint256 public numWorker = 0;

    constructor(string memory name, string memory symbol)
        public
        ERC721Full(name, symbol)
    {}

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

    function createWorker(address workerAddress) public {
        worker memory newWorker = worker(workerAddress, true);
        uint256 workerId = ++numWorker;
        workers[workerId] = newWorker;
        _safeMint(_msgSender(), workerId);
        emit WorkerAdded(workerId, workerAddress);
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