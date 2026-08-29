export const CONTRACT_ADDRESSES = {
  SMASH_TOKEN: import.meta.env.VITE_SMASH_TOKEN_ADDRESS || '0x1234567890123456789012345678901234567890',
  REWARD_VAULT: import.meta.env.VITE_REWARD_VAULT_ADDRESS || '0x2345678901234567890123456789012345678901',
  PROFILE_NFT: import.meta.env.VITE_PROFILE_NFT_ADDRESS || '0x3456789012345678901234567890123456789012',
  LEADERBOARD: import.meta.env.VITE_LEADERBOARD_ADDRESS || '0x4567890123456789012345678901234567890123',
};

export const SMASH_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function claimFaucet() returns (bool)',
  'function burnForGarageItem(uint256 amount, string calldata itemId) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event FaucetClaimed(address indexed recipient, uint256 amount)',
];

export const REWARD_VAULT_ABI = [
  'function claimMatchReward(bytes32 matchId, uint256 kills, bool isWinner) returns (uint256)',
  'function claimQuestReward(string calldata questId) returns (uint256)',
  'function totalRewardsClaimed(address player) view returns (uint256)',
  'event MatchRewardClaimed(address indexed player, bytes32 indexed matchId, uint256 kills, bool isWinner, uint256 totalAmount)',
  'event QuestRewardClaimed(address indexed player, string questId, uint256 rewardAmount)',
];

export const PROFILE_NFT_ABI = [
  'function mintLicense(string calldata pilotName, string calldata kartClass) returns (uint256)',
  'function updateStats(uint256 level, uint256 wins, uint256 kills)',
  'function getPlayerBadge(address player) view returns (tuple(string pilotName, string kartClass, uint256 level, uint256 wins, uint256 totalKills, uint256 mintedAt))',
  'function playerTokenId(address player) view returns (uint256)',
  'event BadgeMinted(address indexed player, uint256 indexed tokenId, string pilotName, string kartClass)',
];

export const LEADERBOARD_ABI = [
  'function submitScore(string calldata pilotName, uint256 score, uint256 kills, string calldata mapId)',
  'function getTopRecords() view returns (tuple(address player, string pilotName, uint256 score, uint256 kills, string mapId, uint256 timestamp)[])',
  'event ScoreSubmitted(address indexed player, string pilotName, uint256 score, uint256 kills, string mapId)',
];
