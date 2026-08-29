const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("🚀 Deploying RaceLeaderboard & RaceWager on Monad Testnet (Chain ID 10143)...");
  console.log("=================================================");

  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = deployer ? deployer.address : "0x0000000000000000000000000000000000000000";
  console.log("Deployer / Admin Address:", deployerAddress);

  // Use deployer as initial reporter (can be transferred to game server later)
  const reporterAddress = process.env.REPORTER_ADDRESS || deployerAddress;
  console.log("Authorized Reporter Address:", reporterAddress);

  // 1. Deploy RaceLeaderboard
  console.log("\n1. Deploying RaceLeaderboard.sol...");
  const RaceLeaderboard = await hre.ethers.getContractFactory("RaceLeaderboard");
  const leaderboard = await RaceLeaderboard.deploy(deployerAddress, reporterAddress);
  await leaderboard.waitForDeployment();
  const leaderboardAddress = await leaderboard.getAddress();
  console.log("✅ RaceLeaderboard deployed to:", leaderboardAddress);

  // 2. Deploy RaceWager
  console.log("\n2. Deploying RaceWager.sol...");
  const RaceWager = await hre.ethers.getContractFactory("RaceWager");
  const wager = await RaceWager.deploy(deployerAddress, reporterAddress);
  await wager.waitForDeployment();
  const wagerAddress = await wager.getAddress();
  console.log("✅ RaceWager deployed to:", wagerAddress);

  const deploymentData = {
    network: "monadTestnet",
    chainId: 10143,
    rpcUrl: "https://testnet-rpc.monad.xyz",
    explorer: "https://testnet.monadexplorer.com",
    deployedAt: new Date().toISOString(),
    admin: deployerAddress,
    reporter: reporterAddress,
    contracts: {
      RaceLeaderboard: leaderboardAddress,
      RaceWager: wagerAddress,
    },
  };

  const outputPath = path.join(__dirname, "../src/web3/deployedMonadModules.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));

  console.log("=================================================");
  console.log("🎉 Monad Modules Deployed Successfully!");
  console.log("Configuration saved to src/web3/deployedMonadModules.json");
  console.log("=================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
