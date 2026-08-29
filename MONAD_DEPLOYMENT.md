# 🌐 Monad Testnet Deployment Guide

This guide details how to compile, test, deploy, and interact with the Monad SmashKarts smart contract suite on the **Monad Testnet** using **Foundry** or **Hardhat**.

---

## 1. Network Parameters

| Parameter | Value |
| :--- | :--- |
| **Network Name** | Monad Testnet |
| **Chain ID** | `10143` (Hex: `0x279f`) |
| **RPC Endpoint** | `https://testnet-rpc.monad.xyz` |
| **Currency Symbol** | `MON` (18 decimals) |
| **Block Explorer** | `https://testnet.monadexplorer.com` |
| **Faucet** | `https://faucet.monad.xyz` |

---

## 2. Contracts Architecture

### Core Gameplay & Wagering Modules
- **`RaceLeaderboard.sol`**:
  - OpenZeppelin `AccessControl` managed track leaderboards.
  - Submits results via `REPORTER_ROLE` and only updates storage if the run beats the player's personal best time for `bytes32 trackId`.
  - View helpers: `getTopTimes(trackId, count)` and `getPlayerBest(trackId, player)`.
- **`RaceWager.sol`**:
  - Escrow-based betting in native `MON` for head-to-head or multiplayer races.
  - States: `Open` ➔ `Locked` ➔ `Settled` or `Cancelled`.
  - Reentrancy guarded with checks-effects-interactions order.
  - Automatic 15-minute lock timeout refund protection via `claimRefund(matchId)`.
- **`SmashToken.sol`**: ERC-20 token (`$SMASH`) with faucet and garage burn features.
- **`KartRewardVault.sol`**: Match score verification and on-chain reward dispenser.
- **`KartProfileNFT.sol`**: ERC-721 Player Profile & Kart License NFT.

---

## 3. Testing Contracts

### Using Hardhat
```bash
npx hardhat test
```
*Executes all 17 unit and integration tests covering role authorization, score tracking, match escrow lifecycle, and timeout refunds.*

### Using Foundry
```bash
forge test -v
```

---

## 4. Deployment to Monad Testnet

### Option A: Hardhat Deployment
1. Configure `.env`:
   ```env
   MONAD_RPC_URL=https://testnet-rpc.monad.xyz
   PRIVATE_KEY=your_deployer_private_key_with_test_mon
   REPORTER_ADDRESS=your_authorized_reporter_address
   ```

2. Run the deployment script:
   ```bash
   npx hardhat run scripts/deploy_wager_and_leaderboard.cjs --network monadTestnet
   ```

### Option B: Foundry Deployment
```bash
forge script script/DeployMonadModules.s.sol:DeployMonadModules \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast \
  --legacy
```

---

## 5. Client Integration

### Java / LibGDX Client
- File: [`src/web3/java/MonadService.java`](file:///c:/Users/Moin/Downloads/last%20time/Pixcel-War/src/web3/java/MonadService.java)
- Uses `Web3j` (`org.web3j:core:4.10.3`).
- Provides asynchronous futures with status listeners (`IDLE`, `PREPARING`, `PENDING`, `CONFIRMED`, `FAILED`).

### React / TypeScript Web Client
- File: [`src/ui/screens/WagerLobbyModal.tsx`](file:///c:/Users/Moin/Downloads/last%20time/Pixcel-War/src/ui/screens/WagerLobbyModal.tsx)
- Connects through [`src/web3/Web3Context.tsx`](file:///c:/Users/Moin/Downloads/last%20time/Pixcel-War/src/web3/Web3Context.tsx) with live transaction notifications.
