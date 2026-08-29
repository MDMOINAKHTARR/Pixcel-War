// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KartLeaderboard
 * @notice On-chain high scores and seasonal tournament registry on Monad Testnet
 */
contract KartLeaderboard {
    struct MatchRecord {
        address player;
        string pilotName;
        uint256 score;
        uint256 kills;
        string mapId;
        uint256 timestamp;
    }

    MatchRecord[] public topRecords;
    uint256 public constant MAX_RECORDS = 50;

    event ScoreSubmitted(
        address indexed player,
        string pilotName,
        uint256 score,
        uint256 kills,
        string mapId
    );

    function submitScore(
        string calldata pilotName,
        uint256 score,
        uint256 kills,
        string calldata mapId
    ) external {
        MatchRecord memory record = MatchRecord({
            player: msg.sender,
            pilotName: pilotName,
            score: score,
            kills: kills,
            mapId: mapId,
            timestamp: block.timestamp
        });

        if (topRecords.length < MAX_RECORDS) {
            topRecords.push(record);
        } else {
            // Find lowest score
            uint256 minIdx = 0;
            uint256 minScore = topRecords[0].score;
            for (uint256 i = 1; i < topRecords.length; i++) {
                if (topRecords[i].score < minScore) {
                    minScore = topRecords[i].score;
                    minIdx = i;
                }
            }

            if (score > minScore) {
                topRecords[minIdx] = record;
            }
        }

        emit ScoreSubmitted(msg.sender, pilotName, score, kills, mapId);
    }

    function getTopRecords() external view returns (MatchRecord[] memory) {
        return topRecords;
    }
}
