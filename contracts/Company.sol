pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";

contract Company is ERC721Full {

    uint256 public numCompanies = 0;

    constructor(string memory name, string memory symbol) public ERC721Full(name, symbol);

    struct Company {
        address companyAddress;
        String domain;
        String name;
        bool isActive;
    }

    mapping(uint256 => Company) public companies;

    event CompanyAdded(
        uint256 companyId,
        address companyAddress,
        String domain,
        String name,
        bool isActive
    );

    modifier onlyCompanyOwner(uint256 companyId) {
        require(_msgSender() == getCompanyAddress(companyId), "caller is not the owner of the company");
        _;
    }

    modifier onlyCompanyExists(uint256 companyId) {
        require(getCompanyAddress(companyId) != address(0), "company does not exist");
        _;
    }
    
    modifier onlyActiveCompany(uint256 companyId) {
        require(checkActive(companyId) == true, "company is not active");
        _;
    }

    function createCompany(String name, String domain) {
        Company memory newCompany = Company(_msgSender(), domain, name, True);
        uint256 newCompanyId = numCompanies++;
        companies[newCompanyId] = newCompany;
        _safeMint(_msgSender(), newCompanyId);
        emit CompanyAdded(newCompanyId, _msgSender(), domain, name, True);
    }

    function getCompanyAddress(uint256 companyId) {
        return companies[companyId].companyAddress;
    }
    
    function checkActive(uint256 companyId) onlyCompanyExists(companyId) {
        return companies[companyId].isActive;
    }

    function disableCompany(uint256 companyId) public view onlyCompanyExists(companyId) onlyCompanyOwner(companyId) onlyActiveCompany(companyId) {
        companies[companyId].isActive = False;
    }
}
