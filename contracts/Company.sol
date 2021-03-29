pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";

contract Company is ERC721Full {
    uint256 public numCompanies = 0;

    constructor(string memory name, string memory symbol)
        public
        ERC721Full(name, symbol)
    {}

    struct company {
        address companyAddress;
        string domain;
        string name;
        bool isActive;
    }

    mapping(uint256 => company) public companies;

    event CompanyAdded(
        uint256 companyId,
        address companyAddress,
        string domain,
        string name,
        bool isActive
    );

    modifier onlyCompanyOwner(uint256 companyId) {
        require(
            _msgSender() == getCompanyAddress(companyId),
            "caller is not the owner of the company"
        );
        _;
    }

    modifier onlyCompanyExists(uint256 companyId) {
        require(
            getCompanyAddress(companyId) != address(0),
            "company does not exist"
        );
        _;
    }

    modifier onlyActiveCompany(uint256 companyId) {
        require(checkActive(companyId) == true, "company is not active");
        _;
    }

    function createCompany(string memory name, string memory domain) public {
        company memory newCompany = company(_msgSender(), domain, name, true);
        uint256 newCompanyId = numCompanies++;
        companies[newCompanyId] = newCompany;
        _safeMint(_msgSender(), newCompanyId);
        emit CompanyAdded(newCompanyId, _msgSender(), domain, name, true);
    }

    function getCompanyAddress(uint256 companyId) public returns (address) {
        return companies[companyId].companyAddress;
    }

    function checkActive(uint256 companyId)
        public
        onlyCompanyExists(companyId)
        returns (bool)
    {
        return companies[companyId].isActive;
    }

    function disableCompany(uint256 companyId)
        public
        onlyCompanyExists(companyId)
        onlyCompanyOwner(companyId)
        onlyActiveCompany(companyId)
    {
        companies[companyId].isActive = false;
    }
}
