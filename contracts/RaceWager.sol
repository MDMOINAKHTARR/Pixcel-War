// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RaceWager
 * @notice Open-lobby escrow wagering contract on Monad Testnet.
 * @dev Supports dynamic lobby joining via payable joinMatch(matchId), server-authoritative
 *      match locking and result reporting, and timeout refund protection.
 */
contract RaceWager is AccessControl, ReentrancyGuard {
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    enum MatchState {
        Open,      // Accepting deposits / player joins
        Locked,    // Race started / in progress; no further deposits/withdrawals
        Settled,   // Match completed; winner paid out
        Cancelled  // Match cancelled; deposits refunded
    }

    struct Match {
        uint256 matchId;
        bytes32 trackId;
        uint256 wagerAmount;       // Wager amount in MON per racer (0 for casual)
        uint256 maxPlayers;        // Maximum player capacity (2-4 players)
        uint256 totalPool;         // Total MON currently locked in escrow
        uint256 createdAt;
        uint256 lockedAt;
        uint256 settledAt;
        MatchState state;
        address[] participants;
        address winner;
    }

    uint256 public nextMatchId = 1;

    // Timeout durations
    uint256 public constant LOCK_TIMEOUT = 15 minutes; // If locked > 15 mins with no report, racers can refund
    uint256 public constant OPEN_TIMEOUT = 1 hours;    // If open > 1 hr without locking, racers can refund

    // Mapping: matchId => Match data
    mapping(uint256 => Match) public matches;

    // Mapping: matchId => player => whether player has joined & deposited
    mapping(uint256 => mapping(address => bool)) public hasDeposited;

    // Mapping: matchId => player => participant index
    mapping(uint256 => mapping(address => bool)) public isParticipant;

    // Events
    event MatchCreated(
        uint256 indexed matchId,
        bytes32 indexed trackId,
        uint256 wagerAmount,
        uint256 maxPlayers,
        uint256 createdAt
    );

    event PlayerJoined(
        uint256 indexed matchId,
        address indexed player,
        uint256 amount,
        uint256 currentPlayersCount
    );

    event MatchLocked(
        uint256 indexed matchId,
        uint256 totalPool,
        uint256 lockedAt
    );

    event MatchSettled(
        uint256 indexed matchId,
        address indexed winner,
        uint256 payoutAmount,
        uint256 settledAt
    );

    event WagerRefunded(
        uint256 indexed matchId,
        address indexed player,
        uint256 amount
    );

    event MatchCancelled(
        uint256 indexed matchId,
        string reason
    );

    constructor(address admin, address initialReporter) {
        require(admin != address(0), "Invalid admin address");
        require(initialReporter != address(0), "Invalid reporter address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REPORTER_ROLE, initialReporter);
    }

    /**
     * @notice Creates a new open match escrow on Monad.
     * @dev Callable by the server/reporter or host.
     * @param trackId bytes32 hash of the circuit identifier.
     * @param wagerAmount Required deposit in native MON (0 for free/casual).
     * @param maxPlayers Maximum players allowed (2 to 4).
     * @return matchId The created match unique identifier.
     */
    function createMatch(
        bytes32 trackId,
        uint256 wagerAmount,
        uint256 maxPlayers
    ) external returns (uint256 matchId) {
        require(maxPlayers >= 2, "Minimum 2 players required");
        require(maxPlayers <= 4, "Maximum 4 players allowed");

        matchId = nextMatchId++;
        Match storage m = matches[matchId];
        m.matchId = matchId;
        m.trackId = trackId;
        m.wagerAmount = wagerAmount;
        m.maxPlayers = maxPlayers;
        m.createdAt = block.timestamp;
        m.state = MatchState.Open;

        emit MatchCreated(matchId, trackId, wagerAmount, maxPlayers, block.timestamp);
        return matchId;
    }

    /**
     * @notice Players join the match by escrowing their exact wagerAmount in MON.
     * @param matchId Identifier of the open match.
     */
    function joinMatch(uint256 matchId) external payable nonReentrant {
        Match storage m = matches[matchId];
        require(m.state == MatchState.Open, "Match not accepting players");
        require(!isParticipant[matchId][msg.sender], "Already joined match");
        require(m.participants.length < m.maxPlayers, "Match is full");
        require(msg.value == m.wagerAmount, "Incorrect wager amount sent");

        isParticipant[matchId][msg.sender] = true;
        hasDeposited[matchId][msg.sender] = true;
        m.participants.push(msg.sender);
        m.totalPool += msg.value;

        emit PlayerJoined(matchId, msg.sender, msg.value, m.participants.length);
    }

    /**
     * @notice Locks the match once all participating racers are ready.
     * @dev Restricted to the server/reporter.
     * @param matchId Identifier of the match.
     */
    function lockMatch(uint256 matchId) external onlyRole(REPORTER_ROLE) {
        Match storage m = matches[matchId];
        require(m.state == MatchState.Open, "Match not in Open state");
        require(m.participants.length >= 2, "Need at least 2 players to lock");

        m.state = MatchState.Locked;
        m.lockedAt = block.timestamp;

        emit MatchLocked(matchId, m.totalPool, block.timestamp);
    }

    /**
     * @notice Reports final race finish order and pays out escrow pool to the winner.
     * @dev Restricted to the server/reporter.
     * @param matchId Identifier of the locked match.
     * @param rankedPlayers Ordered list of finishers (first element is the winner).
     */
    function reportResult(
        uint256 matchId,
        address[] calldata rankedPlayers
    ) external onlyRole(REPORTER_ROLE) nonReentrant {
        Match storage m = matches[matchId];
        require(m.state == MatchState.Locked, "Match is not locked");
        require(rankedPlayers.length > 0, "Empty finish results");

        address winner = rankedPlayers[0];
        require(isParticipant[matchId][winner], "Winner not a participant");
        require(hasDeposited[matchId][winner], "Winner did not deposit");

        uint256 payoutAmount = m.totalPool;

        // Checks-Effects
        m.state = MatchState.Settled;
        m.winner = winner;
        m.settledAt = block.timestamp;
        m.totalPool = 0;

        // Interaction (Transfer 100% of escrow pool to the winner if nonzero)
        if (payoutAmount > 0) {
            (bool success, ) = payable(winner).call{value: payoutAmount}("");
            require(success, "Payout transfer failed");
        }

        emit MatchSettled(matchId, winner, payoutAmount, block.timestamp);
    }

    /**
     * @notice Timeout & safety refund: allows players to reclaim their deposit if match stalls.
     * @param matchId Identifier of the match.
     */
    function claimRefund(uint256 matchId) external nonReentrant {
        Match storage m = matches[matchId];
        require(
            m.state == MatchState.Open || m.state == MatchState.Locked || m.state == MatchState.Cancelled,
            "Cannot refund in current state"
        );
        require(hasDeposited[matchId][msg.sender], "No active deposit found");

        if (m.state == MatchState.Locked) {
            require(block.timestamp >= m.lockedAt + LOCK_TIMEOUT, "Lock timeout not elapsed");
        } else if (m.state == MatchState.Open) {
            require(block.timestamp >= m.createdAt + OPEN_TIMEOUT, "Open timeout not elapsed");
        }

        uint256 refundAmount = m.wagerAmount;
        hasDeposited[matchId][msg.sender] = false;

        if (m.totalPool >= refundAmount) {
            m.totalPool -= refundAmount;
        }

        if (m.totalPool == 0) {
            m.state = MatchState.Cancelled;
            emit MatchCancelled(matchId, "All deposits refunded");
        }

        if (refundAmount > 0) {
            (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
            require(success, "Refund transfer failed");
        }

        emit WagerRefunded(matchId, msg.sender, refundAmount);
    }

    /**
     * @notice Emergency administrative cancellation.
     */
    function cancelMatch(uint256 matchId, string calldata reason) external onlyRole(REPORTER_ROLE) {
        Match storage m = matches[matchId];
        require(m.state == MatchState.Open || m.state == MatchState.Locked, "Cannot cancel match");

        m.state = MatchState.Cancelled;
        emit MatchCancelled(matchId, reason);
    }

    /**
     * @notice Returns list of participants who joined a match.
     */
    function getMatchPlayers(uint256 matchId) external view returns (address[] memory) {
        return matches[matchId].participants;
    }
}
