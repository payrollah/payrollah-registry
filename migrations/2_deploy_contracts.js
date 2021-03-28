const Company = artifacts.require("Company");
const Employee = artifacts.require("Employee");

module.exports = function(deployer) {
    return deployer.deploy(Company).then(() => {
        return deployer.deploy(Employee).then(() => {
            return deployer.deploy(Payrollah);
        });
    });
}