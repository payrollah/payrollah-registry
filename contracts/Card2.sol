pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";

contract Card3 is ERC721Full {
    address public owner;
    uint256 public numCards = 0;

    constructor(string memory name, string memory symbol)
        public
        ERC721Full(name, symbol)
    {
        owner = msg.sender;
    }

    struct card {
        uint256 strength;
        uint256 defence;
        uint256 health;
    }

    mapping(uint256 => card) public cards;

    event CardAdded(
        uint256 cardId,
        uint256 strength,
        uint256 defence,
        uint256 health,
        address owner
    );

    modifier onlyOwner() {
        require(_msgSender() == owner, "caller is not the owner");
        _;
    }

    function createCard(
        uint256 strength,
        uint256 defence,
        uint256 health
    ) public onlyOwner {
        card memory newCard = card(strength, defence, health);
        uint256 newCardId = numCards++;
        cards[newCardId] = newCard;
        _safeMint(_msgSender(), newCardId);
        emit CardAdded(newCardId, strength, defence, health, _msgSender());
    }

    function getCardStats(uint256 id)
        public
        view
        returns (
            uint256 strength,
            uint256 defence,
            uint256 health
        )
    {
        return (cards[id].strength, cards[id].defence, cards[id].health);
    }
}
