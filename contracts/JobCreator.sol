pragma solidity ^0.5.0;

import "./Job.sol";
import "./Company.sol";
import "./Worker.sol";

contract JobCreator {
    Worker workerRegistry;
    Company companyRegistry;

    constructor(address _companyRegistry, address _workerRegistry) public {
        workerRegistry = Worker(_workerRegistry);
        companyRegistry = Company(_companyRegistry);
    }

    event JobDeployed(address indexed escrowAddress);

    function deployNewJob(
        address taskRegistry,
        string calldata _title,
        string calldata _description
    ) external returns (address) {
        require(
            companyRegistry.isValidCompanyAddress(msg.sender) ||
                workerRegistry.isValidWorkerAddress(msg.sender),
            "company or worker not registered"
        );

        Job newJob =
            new Job(Task(taskRegistry), msg.sender, _title, _description);
        emit JobDeployed(address(newJob));
        return address(newJob);
    }
}
