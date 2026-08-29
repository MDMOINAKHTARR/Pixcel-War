// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RaceLeaderboard
 * @notice Stores verified on-chain race results and best times per player per track on Monad Testnet.
 * @dev Access controlled via OpenZeppelin AccessControl. Results can only be submitted by addresses
 *      holding the grantable/revocable REPORTER_ROLE.
 */
contract RaceLeaderboard is AccessControl {
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    struct TrackRecord {
        address player;
        uint256 timeMs;
        uint256 timestamp;
    }

    // Mapping: trackId => player address => best lap time in milliseconds
    mapping(bytes32 => mapping(address => uint256)) public playerBestTime;

    // Mapping: trackId => ordered array of top records (fastest first)
    mapping(bytes32 => TrackRecord[]) internal _topTimes;

    // Maximum number of stored top leaderboard records per track
    uint256 public constant MAX_LEADERBOARD_ENTRIES = 50;

    event ResultSubmitted(
        bytes32 indexed trackId,
        address indexed player,
        uint256 timeMs,
        bool isNewPersonalBest,
        uint256 timestamp
    );

    event TrackRecordBroken(
        bytes32 indexed trackId,
        address indexed player,
        uint256 newRecordTimeMs
    );

    /**
     * @notice Initializes the contract and grants DEFAULT_ADMIN_ROLE and REPORTER_ROLE to deployer.
     * @param admin Initial administrator address.
     * @param initialReporter Initial authorized reporter address (can be updated dynamically).
     */
    constructor(address admin, address initialReporter) {
        require(admin != address(0), "Invalid admin address");
        require(initialReporter != address(0), "Invalid reporter address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REPORTER_ROLE, initialReporter);
    }

    /**
     * @notice Submits a race time for a player on a specific track.
     * @dev Restricted to the REPORTER_ROLE. Only updates storage if the time beats
     *      the player's previous best for that trackId.
     * @param trackId bytes32 hash of the track identifier (e.g. keccak256("neon_city")).
     * @param player Address of the racer.
     * @param timeMs Finish / lap time in milliseconds.
     * @return isNewPersonalBest True if this result updated the player's personal best.
     */
    function submitResult(
        bytes32 trackId,
        address player,
        uint256 timeMs
    ) external onlyRole(REPORTER_ROLE) returns (bool isNewPersonalBest) {
        require(player != address(0), "Invalid player address");
        require(timeMs > 0, "Time must be greater than zero");

        uint256 currentBest = playerBestTime[trackId][player];

        // Only update storage if this is the player's first run or beats their previous best
        if (currentBest == 0 || timeMs < currentBest) {
            playerBestTime[trackId][player] = timeMs;
            isNewPersonalBest = true;

            _insertTopTime(trackId, player, timeMs);

            emit ResultSubmitted(trackId, player, timeMs, true, block.timestamp);
        } else {
            emit ResultSubmitted(trackId, player, timeMs, false, block.timestamp);
        }

        return isNewPersonalBest;
    }

    /**
     * @notice Returns the personal best time for a specific player on a track.
     * @param trackId bytes32 hash of the track identifier.
     * @param player Address of the racer.
     * @return timeMs Best time in milliseconds (0 if no recorded time).
     */
    function getPlayerBest(
        bytes32 trackId,
        address player
    ) external view returns (uint256 timeMs) {
        return playerBestTime[trackId][player];
    }

    /**
     * @notice Returns the top leaderboard records for a track (fastest first).
     * @param trackId bytes32 hash of the track identifier.
     * @param count Maximum number of records to return.
     * @return records Array of TrackRecord sorted by ascending timeMs.
     */
    function getTopTimes(
        bytes32 trackId,
        uint256 count
    ) external view returns (TrackRecord[] memory records) {
        TrackRecord[] storage list = _topTimes[trackId];
        uint256 total = list.length;
        uint256 returnCount = count < total ? count : total;

        records = new TrackRecord[](returnCount);
        for (uint256 i = 0; i < returnCount; i++) {
            records[i] = list[i];
        }
        return records;
    }

    /**
     * @notice Total number of leaderboard records stored for a track.
     */
    function getTrackRecordCount(bytes32 trackId) external view returns (uint256) {
        return _topTimes[trackId].length;
    }

    /**
     * @dev Internal helper to insert/update and sort a record in the top times list.
     */
    function _insertTopTime(bytes32 trackId, address player, uint256 timeMs) internal {
        TrackRecord[] storage list = _topTimes[trackId];

        // Check if player already exists in the top list and remove older entry
        int256 existingIdx = -1;
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i].player == player) {
                existingIdx = int256(i);
                break;
            }
        }

        if (existingIdx >= 0) {
            // Remove existing record to re-insert at updated sorted position
            for (uint256 j = uint256(existingIdx); j < list.length - 1; j++) {
                list[j] = list[j + 1];
            }
            list.pop();
        }

        // Insert in ascending order of timeMs (fastest first)
        uint256 insertPos = list.length;
        for (uint256 k = 0; k < list.length; k++) {
            if (timeMs < list[k].timeMs) {
                insertPos = k;
                break;
            }
        }

        if (insertPos < MAX_LEADERBOARD_ENTRIES) {
            list.push(TrackRecord({ player: address(0), timeMs: 0, timestamp: 0 }));
            for (uint256 m = list.length - 1; m > insertPos; m--) {
                list[m] = list[m - 1];
            }
            list[insertPos] = TrackRecord({
                player: player,
                timeMs: timeMs,
                timestamp: block.timestamp
            });

            if (list.length > MAX_LEADERBOARD_ENTRIES) {
                list.pop();
            }

            if (insertPos == 0) {
                emit TrackRecordBroken(trackId, player, timeMs);
            }
        }
    }
}
