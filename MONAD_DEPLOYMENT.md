# 🌐 Monad Testnet Deployment Guide

This guide details how to compile, test, deploy, and verify the Monad SmashKarts smart contract suite to the **Monad Testnet**.

---

## 1. Network Parameters

| Parameter | Value |
| :--- | :--- |
| **Network Name** | Monad Testnet |
| **Chain ID** | `10143` (Hex: `0x279f`) |
| **RPC Endpoint** | `https://testnet-rpc.monad.xyz` |
| **Currency Symbol** | `MON` (18 decimals) |
| **Block Explorer** | `https://testnet.monadexplorer.com` |

---

## 2. Contracts Architecture

- **`SmashToken.sol`**: ERC-20 token (`$SMASH`) with testnet faucet, gameplay rewards minting, and in-game garage burn functions.
- **`KartRewardVault.sol`**: Match score verification and on-chain reward dispenser.
- **`KartProfileNFT.sol`**: ERC-721 Player Profile & Kart License NFT storing player statistics and license credentials.
- **`KartLeaderboard.sol`**: On-chain high-score leaderboard registry.

---

## 3. Deployment Steps

### Step 1: Configure Environment Variables
Copy `.env.example` to `.env` and set your deployer private key (ensure you have testnet `MON` from the Monad Testnet faucet):

```bash
cp .env.example .env
```

Set:
```env
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
PRIVATE_KEY=your_monad_testnet_private_key
```

### Step 2: Install Hardhat Toolbox (if not already installed)
```bash
npm install -D @nomicfoundation/hardhat-toolbox hardhat dotenv
```

### Step 3: Run Deployment Script
```bash
npx hardhat run scripts/deploy.cjs --network monadTestnet
```

The script will:
1. Deploy `SmashToken`
2. Deploy `KartRewardVault` and authorize it in `SmashToken`
3. Deploy `KartProfileNFT`
4. Deploy `KartLeaderboard`
5. Save deployed addresses to `src/web3/deployedAddresses.json`

---

## 4. Frontend Integration

Update your `.env` frontend contract variables:
```env
VITE_SMASH_TOKEN_ADDRESS=0x...
VITE_REWARD_VAULT_ADDRESS=0x...
VITE_PROFILE_NFT_ADDRESS=0x...
VITE_LEADERBOARD_ADDRESS=0x...
```

The React frontend automatically connects to these deployed contracts and facilitates reward claims, faucet requests, and NFT minting.
