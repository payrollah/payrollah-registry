pragma solidity ^0.5.0;

import "./Job.sol";
import "./Company.sol";
import "./Worker.sol";
import "./Task.sol";

contract JobCreator {
    Worker workerRegistry;
    Company companyRegistry;
    Task taskRegistry;

    constructor(
        address _companyRegistry,
        address _workerRegistry,
        address _taskRegistry
    ) public {
        workerRegistry = Worker(_workerRegistry);
        companyRegistry = Company(_companyRegistry);
        taskRegistry = Task(_taskRegistry);
    }

    event JobDeployed(address indexed jobAddress, address indexed jobOwner);

    function deployNewJob(string calldata _title, string calldata _description)
        external
        returns (address)
    {
        require(
            companyRegistry.isValidCompanyAddress(msg.sender) ||
                workerRegistry.isValidWorkerAddress(msg.sender),
            "company or worker not registered"
        );

        Job newJob = new Job(taskRegistry, msg.sender, _title, _description);
        emit JobDeployed(address(newJob), msg.sender);
        return address(newJob);
    }
}
