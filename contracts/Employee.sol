pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";

contract Employee is ERC721Full {
    uint256 public numEmployee = 0;

    constructor(string memory name, string memory symbol)
        public
        ERC721Full(name, symbol)
    {}

    enum periodEnum {daily, weekly, biweekly, monthly}

    struct employee {
        address employeeAddress;
        uint256 salaryPerPeriod;
        periodEnum period;
        uint256 startDate;
        uint256 endDate;
        bool isActive;
        bool isRegular;
    }

    mapping(uint256 => employee) public employees;

    event EmployeeAdded(
        uint256 indexed employeeId,
        address indexed employeeAddress,
        periodEnum period,
        bool isRegular
    );

    modifier onlyOwner(uint256 employeeId) {
        require(
            msg.sender == ownerOf(employeeId),
            "caller is not the owner of token"
        );
        _;
    }

    function createEmployee(
        address employeeAddress,
        uint256 salaryPerPeriod,
        periodEnum period,
        uint256 startDate,
        uint256 endDate,
        bool isActive,
        bool isRegular
    ) public {
        employee memory newEmployee =
            employee(
                employeeAddress,
                salaryPerPeriod,
                period,
                startDate,
                endDate,
                isActive,
                isRegular
            );
        uint256 employeeId = numEmployee++;
        employees[employeeId] = newEmployee;
        _safeMint(_msgSender(), employeeId);
        emit EmployeeAdded(employeeId, employeeAddress, period, isRegular);
    }

    function disableEmployee(uint256 employeeId) public onlyOwner(employeeId) {
        employees[employeeId].isActive = false;
    }

    // function getRegularPayrollAmt(uint256 employeeId) public returns (uint256) {
    //     if (employees[employeeId].isActive == false) {
    //         return 0;
    //     } else {
    //         return salaryPerPeriod;
    //     }
    // }

    function updateSalaryAmount(uint256 employeeId, uint256 newSalaryAmount)
        public
        onlyOwner(employeeId)
    {
        require(employees[employeeId].isActive == true); // Employee needs to be active
        employees[employeeId].salaryPerPeriod = newSalaryAmount;
    }

    function getEmployeeAddress(uint256 employeeId) public returns (address) {
        return employees[employeeId].employeeAddress;
    }

    function getSalaryPerPeriod(uint256 employeeId) public returns (uint256) {
        return employees[employeeId].salaryPerPeriod;
    }

    function getPeriodType(uint256 employeeId) public returns (periodEnum) {
        return employees[employeeId].period;
    }

    function getStartDate(uint256 employeeId) public returns (uint256) {
        return employees[employeeId].startDate;
    }

    function getEndDate(uint256 employeeId) public returns (uint256) {
        return employees[employeeId].endDate;
    }

    function checkActive(uint256 employeeId) public returns (bool) {
        return employees[employeeId].isActive;
    }

    function checkRegular(uint256 employeeId) public returns (bool) {
        return employees[employeeId].isRegular;
    }
}
