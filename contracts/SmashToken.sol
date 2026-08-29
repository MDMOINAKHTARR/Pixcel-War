// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SmashToken ($SMASH)
 * @notice ERC-20 Reward and In-Game Utility Token for Monad SmashKarts
 * @dev Optimized for Monad Testnet with testnet faucet, gameplay rewards, and garage burning
 */
contract SmashToken {
    string public name = "Monad Smash Token";
    string public symbol = "SMASH";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    address public owner;
    address public rewardVault;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public lastFaucetClaim;

    uint256 public constant FAUCET_AMOUNT = 100 * 10**18; // 100 SMASH
    uint256 public constant FAUCET_COOLDOWN = 1 hours;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event RewardVaultUpdated(address indexed newVault);
    event FaucetClaimed(address indexed recipient, uint256 amount);
    event InGameBurn(address indexed burner, uint256 amount, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == rewardVault, "Not authorized to mint");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Mint initial supply to owner for liquidity & reward pools
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    function setRewardVault(address _rewardVault) external onlyOwner {
        rewardVault = _rewardVault;
        emit RewardVaultUpdated(_rewardVault);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(to != address(0), "Invalid recipient");
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(to != address(0), "Invalid recipient");
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Allowance exceeded");

        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }

    function mintReward(address recipient, uint256 amount) external onlyAuthorized returns (bool) {
        _mint(recipient, amount);
        return true;
    }

    function claimFaucet() external returns (bool) {
        require(block.timestamp - lastFaucetClaim[msg.sender] >= FAUCET_COOLDOWN, "Faucet cooldown active");
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
        return true;
    }

    function burnForGarageItem(uint256 amount, string calldata itemId) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient SMASH balance");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
        emit InGameBurn(msg.sender, amount, itemId);
        return true;
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "Invalid address");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
