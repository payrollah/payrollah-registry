pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./Company.sol";
import "./Employee.sol";

// import "contracts/Interface/SchedulerInterface.sol"; // this import imports a file that doesnt exist

contract Payrollah {
    uint256 public numClaims = 0;
    uint256 public numTransactions = 0;
    // uint256 averageBlockTime = 13; //assumption: 13 seconds per block

    Employee employeeBasket;
    Company companyBasket;
    ERC20 stableCoinAddress;

    enum claimStatusEnum {pending, cancelled, accepted}

    // SchedulerInterface public scheduler;
    // address stableCoinAddress;
    // uint paymentInterval;
    // uint paymentValue;
    // uint lockedUntil;

    // address recipient;
    // address public currentScheduledTransaction;

    constructor(
        ERC20 StableCoinContractAddress,
        Employee employeeAddress,
        Company companydAddress
    ) public {
        stableCoinAddress = StableCoinContractAddress;
        employeeBasket = employeeAddress;
        companyBasket = companydAddress;
    }

    mapping(uint256 => mapping(uint256 => bool)) companyEmployees;
    mapping(uint256 => salaryClaim) public claims;

    struct salaryClaim {
        uint256 claimId;
        uint256 employeeId;
        uint256 companyId;
        uint256 timesheet;
        claimStatusEnum status;
        bool isLoan;
        string messageToClaim;
        string messageReject;
    }

    event salaryTransactionSucess(
        uint256 indexed transactionId,
        address indexed employeeAddres,
        address indexed companyAddress,
        uint256 date,
        uint256 salaryAmount
    );
    event claimTransactionSucess(
        uint256 indexed claimId,
        address indexed employeeAddress,
        address indexed companyAdress,
        uint256 date,
        uint256 salaryAmount,
        bool isLoan
    );

    // event PaymentScheduled(address indexed scheduledTransaction, address recipient, uint value);
    // event PaymentExecuted(address indexed scheduledTransaction, address recipient, uint value);

    modifier onlyActiveCompany(uint256 companyId) {
        require(companyBasket.checkActive(companyId), "company is not active");
        _;
    }

    modifier onlyEmployeeOfCompany(uint256 employeeId, uint256 companyId) {
        require(
            isEmployeeOfCompany(employeeId, companyId),
            "not a employee of the company"
        );
        _;
    }

    // function RecurringPayment(
    //     address _scheduler,
    //     uint _paymentInterval,
    //     uint _paymentValue,
    //     address _recipient
    // )  public payable {
    //     scheduler = SchedulerInterface(_scheduler);
    //     paymentInterval = _paymentInterval;
    //     recipient = _recipient;
    //     paymentValue = _paymentValue;

    //     schedule();
    // }

    // function () //fallback function triggered
    //     public payable
    // {
    //     if (msg.value > 0) { //this handles recieving remaining funds sent while scheduling (0.1 ether)
    //         return;
    //     }

    //     process();
    // }

    // function process() public returns (bool) {
    //     payout();
    //     schedule();
    //     // doesnt return anything right?
    // }

    // function payout()
    //     private returns (bool)
    // {
    //     require(block.number >= lockedUntil);
    //     require(address(this).balance >= paymentValue); // change to use erc20 later

    //     // recipient & paymentValue not defined
    //     recipient.transfer(paymentValue);

    //     // currentScheduledTransaction is not defined
    //     emit PaymentExecuted(currentScheduledTransaction, recipient, paymentValue);
    //     return true;
    // }

    // function schedule()
    //     private returns (bool)
    // {
    //     lockedUntil = block.number + paymentInterval;

    //     currentScheduledTransaction = scheduler.schedule.value(0.1 ether)( // 0.1 ether is to pay for gas, bounty and fee
    //         this,                   // send to self
    //         "",                     // and trigger fallback function
    //         [
    //             1000000,            // The amount of gas to be sent with the transaction. Accounts for payout + new contract deployment
    //             0,                  // The amount of wei to be sent.
    //             255,                // The size of the execution window.
    //             lockedUntil,        // The start of the execution window.
    //             20000000000 wei,    // The gasprice for the transaction (aka 20 gwei)
    //             20000000000 wei,    // The fee included in the transaction.
    //             20000000000 wei,         // The bounty that awards the executor of the transaction.
    //             30000000000 wei     // The required amount of wei the claimer must send as deposit.
    //         ]
    //     );

    //     emit PaymentScheduled(currentScheduledTransaction, recipient, paymentValue);
    // }

    function registerEmployee(uint256 employeeId, uint256 companyId)
        public
        onlyActiveCompany(companyId)
    {
        // Add employee to the company list
        companyEmployees[companyId][employeeId] = true;

        // // Add recurring playment
        // if(employeeBasket.checkRegular(employeeId) == true){
        //     if (employeeBasket.getPeriodType(employeeId) == periodEnum.daily) {
        //         interval = 86400 / averageBlockTime
        //     } else if (employeeBasket.getPeriodType(employeeId) == periodEnum.weekly) {
        //         interval = 604800 / averageBlockTime
        //     } else if (employeeBasket.getPeriodType(employeeId) == periodEnum.biweekly) {
        //         interval = 1209600 / averageBlockTime
        //     } else {
        //         interval = 2592000 / averageBlockTime
        //     }
        //     RecurringPayment(_msgSender(), interval, employeeBasket.getSalaryPerPeriod(employeeId),employeeBasket.getEmployeeAddress(employeeId));
        // }
    }

    function isEmployeeOfCompany(uint256 employeeId, uint256 companyId)
        public
        view
        returns (bool)
    {
        return companyEmployees[companyId][employeeId];
    }

    function removeEmployee(uint256 employeeId, uint256 companyId)
        public
        onlyActiveCompany(companyId)
        onlyEmployeeOfCompany(employeeId, companyId)
    {
        // search for and disable the employee
        employeeBasket.disableEmployee(employeeId); //or whatever you want to do if it matches
        // remove recurring payment
    }

    function applyPreLoan(
        uint256 employeeId,
        uint256 companyId,
        uint256 timeSheet,
        string memory message
    ) public onlyEmployeeOfCompany(employeeId, companyId) returns (uint256) {
        salaryClaim memory newSalaryClaim =
            salaryClaim(
                numClaims,
                employeeId,
                companyId,
                timeSheet,
                claimStatusEnum.pending,
                true,
                message,
                ""
            );
        claims[numClaims] = newSalaryClaim;
        numClaims++;
        return numClaims;
    }

    // redundant cuz we can just make claims public...
    // function getClaimInfo(uint256 claimId) public returns (salaryClaim memory) {
    //     return claims[claimId];
    // }

    // add only claimee can delete
    function cancelClaim(uint256 claimId) public {
        delete claims[claimId];
    }

    // To be completed

    // function acceptClaim(uint256 claimId) public payable onlyCompany() {
    //     salaryClaim memory currentSalaryClaim = claims[claimId];
    //     uint256 amountPaid = currentSalaryClaim.timesheet *
    //     stableCoinAddress.transferFrom(msg.sender, )
    // }
}
