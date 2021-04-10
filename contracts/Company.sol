pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";

contract Company is ERC721Full {
    // ERC165: Interface for this contract, can be calculated by calculateTaskERC721Selector()
    // Only append new interface id for backward compatibility
    bytes4 private constant _INTERFACE_ID_TASK = 0x3c3ad21b;

    uint256 public numCompanies = 0;

    constructor(string memory name, string memory symbol)
        public
        ERC721Full(name, symbol)
    {
        _registerInterface(_INTERFACE_ID_TASK);
    }

    struct company {
        address companyAddress;
        string domain;
        string name;
        bool isActive;
    }

    mapping(uint256 => company) public companies;

    event CompanyAdded(
        uint256 companyId,
        address indexed companyAddress,
        string domain,
        string indexed name,
        bool isActive
    );

    modifier onlyOwner(uint256 companyId) {
        require(
            _msgSender() == ownerOf(companyId),
            "caller is not the owner of the company"
        );
        _;
    }

    modifier onlyExistingCompany(uint256 companyId) {
        require(isExistingCompany(companyId), "company does not exist");
        _;
    }

    modifier onlyActiveCompany(uint256 companyId) {
        require(isActiveCompany(companyId), "company is not active");
        _;
    }

    function createCompany(string memory name, string memory domain)
        public
        returns (uint256)
    {
        company memory newCompany = company(_msgSender(), domain, name, true);
        uint256 newCompanyId = ++numCompanies;
        companies[newCompanyId] = newCompany;
        _safeMint(_msgSender(), newCompanyId);
        emit CompanyAdded(newCompanyId, _msgSender(), domain, name, true);
        return newCompanyId;
    }

    function getCompanyAddress(uint256 companyId)
        public
        view
        returns (address)
    {
        return companies[companyId].companyAddress;
    }

    function getCompanyIdByAddress(address companyAddress)
        public
        view
        returns (uint256)
    {
        return tokenOfOwnerByIndex(companyAddress, 0);
    }

    function isActiveCompany(uint256 companyId) public view returns (bool) {
        return companies[companyId].isActive;
    }

    function isExistingCompany(uint256 companyId) public view returns (bool) {
        return getCompanyAddress(companyId) != address(0);
    }

    function isValidCompany(uint256 companyId) public view returns (bool) {
        return isActiveCompany(companyId) && isExistingCompany(companyId);
    }

    function isValidCompanyAddress(address companyAddress)
        public
        view
        returns (bool)
    {
        uint256 companyId = getCompanyIdByAddress(companyAddress);
        return isValidCompany(companyId);
    }

    function disableCompany(uint256 companyId)
        public
        onlyExistingCompany(companyId)
        onlyOwner(companyId)
        onlyActiveCompany(companyId)
    {
        companies[companyId].isActive = false;
    }
}

contract calculateCompanyERC721Selector {
    // Using only core functions as getter and checker would cause a deep stack
    function calculateSelector() public pure returns (bytes4) {
        Company i;
        return
            i.createCompany.selector ^
            i.getCompanyAddress.selector ^
            i.getCompanyIdByAddress.selector ^
            i.isActiveCompany.selector ^
            i.isExistingCompany.selector ^
            i.isValidCompany.selector ^
            i.isValidCompanyAddress.selector ^
            i.disableCompany.selector;
    }
}
