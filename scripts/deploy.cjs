const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=========================================");
  console.log("🚀 Deploying Monad SmashKarts on Monad Testnet (Chain ID 10143)...");
  console.log("=========================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer ? deployer.address : "No signer configured");

  // 1. Deploy SmashToken
  console.log("1. Deploying SmashToken ($SMASH)...");
  const SmashToken = await hre.ethers.getContractFactory("SmashToken");
  const smashToken = await SmashToken.deploy();
  await smashToken.waitForDeployment();
  const smashTokenAddress = await smashToken.getAddress();
  console.log("✅ SmashToken deployed to:", smashTokenAddress);

  // 2. Deploy KartRewardVault
  console.log("2. Deploying KartRewardVault...");
  const KartRewardVault = await hre.ethers.getContractFactory("KartRewardVault");
  const rewardVault = await KartRewardVault.deploy(smashTokenAddress);
  await rewardVault.waitForDeployment();
  const rewardVaultAddress = await rewardVault.getAddress();
  console.log("✅ KartRewardVault deployed to:", rewardVaultAddress);

  // Authorize Vault to mint tokens
  console.log("Setting reward vault in SmashToken...");
  const tx = await smashToken.setRewardVault(rewardVaultAddress);
  await tx.wait();
  console.log("✅ Reward vault authorized!");

  // 3. Deploy KartProfileNFT
  console.log("3. Deploying KartProfileNFT...");
  const KartProfileNFT = await hre.ethers.getContractFactory("KartProfileNFT");
  const profileNFT = await KartProfileNFT.deploy();
  await profileNFT.waitForDeployment();
  const profileNFTAddress = await profileNFT.getAddress();
  console.log("✅ KartProfileNFT deployed to:", profileNFTAddress);

  // 4. Deploy KartLeaderboard
  console.log("4. Deploying KartLeaderboard...");
  const KartLeaderboard = await hre.ethers.getContractFactory("KartLeaderboard");
  const leaderboard = await KartLeaderboard.deploy();
  await leaderboard.waitForDeployment();
  const leaderboardAddress = await leaderboard.getAddress();
  console.log("✅ KartLeaderboard deployed to:", leaderboardAddress);

  const deploymentInfo = {
    network: "monadTestnet",
    chainId: 10143,
    deployedAt: new Date().toISOString(),
    contracts: {
      SmashToken: smashTokenAddress,
      KartRewardVault: rewardVaultAddress,
      KartProfileNFT: profileNFTAddress,
      KartLeaderboard: leaderboardAddress,
    },
  };

  const outputDir = path.join(__dirname, "../src/web3");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "deployedAddresses.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("=========================================");
  console.log("🎉 Deployment complete! Addresses saved to src/web3/deployedAddresses.json");
  console.log("=========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
