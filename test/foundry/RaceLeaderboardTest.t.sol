// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../contracts/RaceLeaderboard.sol";

contract RaceLeaderboardTest is Test {
    RaceLeaderboard public leaderboard;
    address public admin = address(0xAD);
    address public reporter = address(0xAA);
    address public racer1 = address(0x11);
    address public racer2 = address(0x22);
    address public nonReporter = address(0x99);

    bytes32 public trackCity = keccak256("neon_city");
    bytes32 public trackDesert = keccak256("desert_dunes");

    function setUp() public {
        leaderboard = new RaceLeaderboard(admin, reporter);
    }

    function test_InitialRoles() public view {
        assertTrue(leaderboard.hasRole(leaderboard.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(leaderboard.hasRole(leaderboard.REPORTER_ROLE(), reporter));
        assertFalse(leaderboard.hasRole(leaderboard.REPORTER_ROLE(), nonReporter));
    }

    function test_RevertWhen_NonReporterSubmits() public {
        vm.prank(nonReporter);
        vm.expectRevert();
        leaderboard.submitResult(trackCity, racer1, 45000);
    }

    function test_SubmitResult_InitialTime() public {
        vm.prank(reporter);
        bool isNewBest = leaderboard.submitResult(trackCity, racer1, 45200);
        assertTrue(isNewBest);

        assertEq(leaderboard.getPlayerBest(trackCity, racer1), 45200);

        RaceLeaderboard.TrackRecord[] memory top = leaderboard.getTopTimes(trackCity, 10);
        assertEq(top.length, 1);
        assertEq(top[0].player, racer1);
        assertEq(top[0].timeMs, 45200);
    }

    function test_SubmitResult_ImproveTime() public {
        vm.startPrank(reporter);
        leaderboard.submitResult(trackCity, racer1, 50000);
        assertEq(leaderboard.getPlayerBest(trackCity, racer1), 50000);

        // Improved time
        bool isNewBest = leaderboard.submitResult(trackCity, racer1, 42000);
        assertTrue(isNewBest);
        assertEq(leaderboard.getPlayerBest(trackCity, racer1), 42000);

        // Slower time does NOT update best
        isNewBest = leaderboard.submitResult(trackCity, racer1, 48000);
        assertFalse(isNewBest);
        assertEq(leaderboard.getPlayerBest(trackCity, racer1), 42000);
        vm.stopPrank();
    }

    function test_GetTopTimes_SortedFastestFirst() public {
        vm.startPrank(reporter);
        leaderboard.submitResult(trackCity, racer1, 45000);
        leaderboard.submitResult(trackCity, racer2, 41000);
        vm.stopPrank();

        RaceLeaderboard.TrackRecord[] memory top = leaderboard.getTopTimes(trackCity, 10);
        assertEq(top.length, 2);
        assertEq(top[0].player, racer2); // Fastest
        assertEq(top[0].timeMs, 41000);
        assertEq(top[1].player, racer1);
        assertEq(top[1].timeMs, 45000);
    }
}
