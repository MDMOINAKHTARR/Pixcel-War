// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KartProfileNFT
 * @notice ERC-721 Player Profile & Kart License NFT on Monad Testnet
 */
contract KartProfileNFT {
    string public name = "Monad Kart Master License";
    string public symbol = "KARTNFT";
    uint256 public nextTokenId = 1;
    address public owner;

    struct PlayerBadge {
        string pilotName;
        string kartClass;
        uint256 level;
        uint256 wins;
        uint256 totalKills;
        uint256 mintedAt;
    }

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public playerTokenId;
    mapping(uint256 => PlayerBadge) public badges;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event BadgeMinted(address indexed player, uint256 indexed tokenId, string pilotName, string kartClass);
    event StatsUpdated(uint256 indexed tokenId, uint256 newLevel, uint256 wins, uint256 kills);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function mintLicense(string calldata pilotName, string calldata kartClass) external returns (uint256) {
        require(playerTokenId[msg.sender] == 0, "License already minted");

        uint256 tokenId = nextTokenId++;
        ownerOf[tokenId] = msg.sender;
        balanceOf[msg.sender] = 1;
        playerTokenId[msg.sender] = tokenId;

        badges[tokenId] = PlayerBadge({
            pilotName: pilotName,
            kartClass: kartClass,
            level: 1,
            wins: 0,
            totalKills: 0,
            mintedAt: block.timestamp
        });

        emit Transfer(address(0), msg.sender, tokenId);
        emit BadgeMinted(msg.sender, tokenId, pilotName, kartClass);
        return tokenId;
    }

    function updateStats(uint256 level, uint256 wins, uint256 kills) external {
        uint256 tokenId = playerTokenId[msg.sender];
        require(tokenId != 0, "No license minted");

        PlayerBadge storage badge = badges[tokenId];
        if (level > badge.level) badge.level = level;
        badge.wins += wins;
        badge.totalKills += kills;

        emit StatsUpdated(tokenId, badge.level, badge.wins, badge.totalKills);
    }

    function getPlayerBadge(address player) external view returns (PlayerBadge memory) {
        uint256 tokenId = playerTokenId[player];
        require(tokenId != 0, "No badge found");
        return badges[tokenId];
    }
}
