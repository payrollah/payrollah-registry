const Company = artifacts.require("Company");
const Worker = artifacts.require("Worker");
const Task = artifacts.require("Task");
const JobCreator = artifacts.require("JobCreator");

module.exports = function(deployer) {
    return deployer.deploy(Company, "CompanyPayrollah", "CP").then((companyInstance) => {
        return deployer.deploy(Worker, "WorkerPayrollah", "WP").then((workerInstance) => {
            return deployer.deploy(Task, "TaskPayrollah", "TP", workerInstance.address).then((taskInstance) => {
                return deployer.deploy(JobCreator, companyInstance.address, workerInstance.address, taskInstance.address);
            });
        });
    });
}