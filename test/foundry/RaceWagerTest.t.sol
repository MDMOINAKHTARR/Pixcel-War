// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../contracts/RaceWager.sol";

contract RaceWagerTest is Test {
    RaceWager public wager;
    address public admin = address(0xAD);
    address public reporter = address(0xAA);
    address public racer1 = address(0x11);
    address public racer2 = address(0x22);
    address public nonParticipant = address(0x99);

    bytes32 public trackCity = keccak256("neon_city");
    uint256 public wagerAmount = 1 ether;

    function setUp() public {
        wager = new RaceWager(admin, reporter);
        vm.deal(racer1, 10 ether);
        vm.deal(racer2, 10 ether);
        vm.deal(nonParticipant, 10 ether);
    }

    function test_CreateMatchAndDeposit() public {
        address[] memory players = new address[](2);
        players[0] = racer1;
        players[1] = racer2;

        uint256 matchId = wager.createMatch(trackCity, players, wagerAmount);
        assertEq(matchId, 1);

        // Deposit racer1
        vm.prank(racer1);
        wager.depositWager{value: wagerAmount}(matchId);
        assertTrue(wager.hasDeposited(matchId, racer1));

        // Non participant reverts
        vm.prank(nonParticipant);
        vm.expectRevert("Not a registered participant");
        wager.depositWager{value: wagerAmount}(matchId);

        // Deposit racer2
        vm.prank(racer2);
        wager.depositWager{value: wagerAmount}(matchId);
        assertTrue(wager.hasDeposited(matchId, racer2));
    }

    function test_FullMatchFlow_LockAndPayout() public {
        address[] memory players = new address[](2);
        players[0] = racer1;
        players[1] = racer2;

        uint256 matchId = wager.createMatch(trackCity, players, wagerAmount);

        vm.prank(racer1);
        wager.depositWager{value: wagerAmount}(matchId);
        vm.prank(racer2);
        wager.depositWager{value: wagerAmount}(matchId);

        // Reporter locks match
        vm.prank(reporter);
        wager.lockMatch(matchId);

        // Settle match with racer1 as winner
        uint256 racer1BalBefore = racer1.balance;

        address[] memory ranked = new address[](2);
        ranked[0] = racer1; // 1st
        ranked[1] = racer2; // 2nd

        vm.prank(reporter);
        wager.reportResult(matchId, ranked);

        uint256 racer1BalAfter = racer1.balance;
        assertEq(racer1BalAfter - racer1BalBefore, 2 ether); // Full pool paid out
    }

    function test_ClaimRefund_AfterLockTimeout() public {
        address[] memory players = new address[](2);
        players[0] = racer1;
        players[1] = racer2;

        uint256 matchId = wager.createMatch(trackCity, players, wagerAmount);

        vm.prank(racer1);
        wager.depositWager{value: wagerAmount}(matchId);
        vm.prank(racer2);
        wager.depositWager{value: wagerAmount}(matchId);

        vm.prank(reporter);
        wager.lockMatch(matchId);

        // Attempting refund immediately reverts
        vm.prank(racer1);
        vm.expectRevert("Lock timeout not elapsed");
        wager.claimRefund(matchId);

        // Fast forward 16 minutes (> 15 min lock timeout)
        vm.warp(block.timestamp + 16 minutes);

        uint256 balBefore = racer1.balance;
        vm.prank(racer1);
        wager.claimRefund(matchId);
        assertEq(racer1.balance - balBefore, 1 ether);
    }
}
