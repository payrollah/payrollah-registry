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
    mapping(address => uint256) public companiesAddresses;

    event CompanyAdded(
        uint256 companyId,
        address companyAddress,
        string domain,
        string name,
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

    function createCompany(string memory name, string memory domain) public {
        company memory newCompany = company(_msgSender(), domain, name, true);
        uint256 newCompanyId = ++numCompanies;
        companies[newCompanyId] = newCompany;
        companiesAddresses[_msgSender()] = newCompanyId;
        _safeMint(_msgSender(), newCompanyId);
        emit CompanyAdded(newCompanyId, _msgSender(), domain, name, true);
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
        return isActiveCompany(companyId) && isExistingCompany(companyId);
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
