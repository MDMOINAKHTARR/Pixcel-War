// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/RaceLeaderboard.sol";
import "../contracts/RaceWager.sol";

/**
 * @title DeployMonadModules
 * @notice Foundry deployment script for deploying RaceLeaderboard and RaceWager to Monad Testnet.
 * @dev Usage:
 *   forge script script/DeployMonadModules.s.sol:DeployMonadModules \
 *     --rpc-url https://testnet-rpc.monad.xyz \
 *     --broadcast --legacy
 */
contract DeployMonadModules is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address reporter = vm.envOr("REPORTER_ADDRESS", deployer);

        console.log("=================================================");
        console.log("Deploying to Monad Testnet (Chain ID 10143)...");
        console.log("Deployer:", deployer);
        console.log("Reporter:", reporter);
        console.log("=================================================");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy RaceLeaderboard
        RaceLeaderboard leaderboard = new RaceLeaderboard(deployer, reporter);
        console.log("RaceLeaderboard deployed at:", address(leaderboard));

        // 2. Deploy RaceWager
        RaceWager wager = new RaceWager(deployer, reporter);
        console.log("RaceWager deployed at:", address(wager));

        vm.stopBroadcast();
    }
}
