package com.monad.smashkarts.web3;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/*
 * Note: To compile this Java module in a LibGDX / JVM environment, include the Web3j core dependency:
 * implementation "org.web3j:core:4.10.3"
 */
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.DynamicArray;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.generated.Bytes32;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.Hash;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthCall;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.DefaultGasProvider;
import org.web3j.tx.gas.StaticGasProvider;
import org.web3j.tx.response.PollingTransactionReceiptProcessor;

/**
 * MonadService
 * Clean, decoupled Web3 service interface for Monad Testnet (Chain ID 10143)
 * encapsulating RaceLeaderboard and RaceWager smart contract interactions using Web3j.
 */
public class MonadService {
    public static final long MONAD_CHAIN_ID = 10143L;
    public static final String DEFAULT_RPC_URL = "https://testnet-rpc.monad.xyz";
    public static final String EXPLORER_URL = "https://testnet.monadexplorer.com";

    public enum TxStatus {
        IDLE,
        PREPARING,
        PENDING,
        CONFIRMED,
        FAILED
    }

    public interface StatusListener {
        void onStatusChanged(TxStatus status, String message, String txHash);
    }

    public static class TrackRecord {
        public String playerAddress;
        public long timeMs;
        public long timestamp;

        public TrackRecord(String playerAddress, long timeMs, long timestamp) {
            this.playerAddress = playerAddress;
            this.timeMs = timeMs;
            this.timestamp = timestamp;
        }
    }

    private final Web3j web3;
    private final String leaderboardContractAddress;
    private final String wagerContractAddress;
    private final Credentials credentials; // Local testnet reporter / player wallet
    private final TransactionManager txManager;
    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private StatusListener statusListener;

    /**
     * Constructs the MonadService instance.
     * @param rpcUrl Monad Testnet RPC endpoint (e.g. https://testnet-rpc.monad.xyz).
     * @param leaderboardAddress Address of the deployed RaceLeaderboard.sol.
     * @param wagerAddress Address of the deployed RaceWager.sol.
     * @param privateKey Optional private key for transaction signing (reporter/player).
     */
    public MonadService(String rpcUrl, String leaderboardAddress, String wagerAddress, String privateKey) {
        this.web3 = Web3j.build(new HttpService(rpcUrl != null ? rpcUrl : DEFAULT_RPC_URL));
        this.leaderboardContractAddress = leaderboardAddress;
        this.wagerContractAddress = wagerAddress;

        if (privateKey != null && !privateKey.trim().isEmpty()) {
            this.credentials = Credentials.create(privateKey);
            this.txManager = new RawTransactionManager(
                this.web3,
                this.credentials,
                MONAD_CHAIN_ID,
                new PollingTransactionReceiptProcessor(this.web3, 1000, 30)
            );
        } else {
            this.credentials = null;
            this.txManager = null;
        }
    }

    public void setStatusListener(StatusListener listener) {
        this.statusListener = listener;
    }

    private void notifyStatus(TxStatus status, String message, String txHash) {
        if (statusListener != null) {
            statusListener.onStatusChanged(status, message, txHash);
        }
    }

    public static byte[] hashTrackId(String trackName) {
        return Hash.sha3(trackName.toLowerCase().getBytes(StandardCharsets.UTF_8));
    }

    // =========================================================================
    // 1. LEADERBOARD INTERACTIONS
    // =========================================================================

    /**
     * Submits a race finish time to the on-chain leaderboard.
     * Called automatically upon race completion if Web3 integration is enabled.
     */
    public CompletableFuture<Boolean> submitRaceResultAsync(String trackName, String playerAddress, long timeMs) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (txManager == null) {
                    notifyStatus(TxStatus.FAILED, "No wallet configured for transaction signing", null);
                    return false;
                }

                notifyStatus(TxStatus.PREPARING, "Submitting race record to Monad Testnet...", null);

                byte[] trackHash = hashTrackId(trackName);
                Function function = new Function(
                    "submitResult",
                    Arrays.asList(
                        new Bytes32(trackHash),
                        new Address(playerAddress),
                        new Uint256(BigInteger.valueOf(timeMs))
                    ),
                    Collections.singletonList(new TypeReference<org.web3j.abi.datatypes.Bool>() {})
                );

                String encodedData = FunctionEncoder.encode(function);
                notifyStatus(TxStatus.PENDING, "Transaction broadcasting to Monad...", null);

                TransactionReceipt receipt = txManager.executeTransaction(
                    BigInteger.valueOf(50_000_000_000L), // 50 Gwei gas price
                    BigInteger.valueOf(350_000L),        // Gas limit
                    leaderboardContractAddress,
                    encodedData,
                    BigInteger.ZERO
                );

                if (receipt.isStatusOK()) {
                    notifyStatus(TxStatus.CONFIRMED, "Record confirmed on Monad!", receipt.getTransactionHash());
                    return true;
                } else {
                    notifyStatus(TxStatus.FAILED, "Transaction reverted on Monad", receipt.getTransactionHash());
                    return false;
                }
            } catch (Exception e) {
                notifyStatus(TxStatus.FAILED, "Error: " + e.getMessage(), null);
                return false;
            }
        }, executor);
    }

    /**
     * Reads a player's on-chain personal best for a track.
     */
    public CompletableFuture<Long> getPlayerBestTimeAsync(String trackName, String playerAddress) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                byte[] trackHash = hashTrackId(trackName);
                Function function = new Function(
                    "getPlayerBest",
                    Arrays.asList(new Bytes32(trackHash), new Address(playerAddress)),
                    Collections.singletonList(new TypeReference<Uint256>() {})
                );

                String encoded = FunctionEncoder.encode(function);
                EthCall response = web3.ethCall(
                    Transaction.createEthCallTransaction(null, leaderboardContractAddress, encoded),
                    DefaultBlockParameterName.LATEST
                ).send();

                List<Type> values = FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());
                if (!values.isEmpty()) {
                    return ((BigInteger) values.get(0).getValue()).longValue();
                }
                return 0L;
            } catch (Exception e) {
                return 0L;
            }
        }, executor);
    }

    // =========================================================================
    // 2. WAGERING INTERACTIONS
    // =========================================================================

    /**
     * Creates a match escrow with the specified wager amount per participant.
     */
    public CompletableFuture<BigInteger> createMatchAsync(String trackName, List<String> playerAddresses, BigInteger wagerAmountWei) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (txManager == null) throw new IllegalStateException("Wallet not initialized");

                notifyStatus(TxStatus.PREPARING, "Creating wager match on Monad...", null);

                List<Address> addressList = new ArrayList<>();
                for (String addr : playerAddresses) {
                    addressList.add(new Address(addr));
                }

                byte[] trackHash = hashTrackId(trackName);
                Function function = new Function(
                    "createMatch",
                    Arrays.asList(
                        new Bytes32(trackHash),
                        new DynamicArray<>(Address.class, addressList),
                        new Uint256(wagerAmountWei)
                    ),
                    Collections.singletonList(new TypeReference<Uint256>() {})
                );

                String encoded = FunctionEncoder.encode(function);
                notifyStatus(TxStatus.PENDING, "Broadcasting match creation...", null);

                TransactionReceipt receipt = txManager.executeTransaction(
                    BigInteger.valueOf(50_000_000_000L),
                    BigInteger.valueOf(400_000L),
                    wagerContractAddress,
                    encoded,
                    BigInteger.ZERO
                );

                if (receipt.isStatusOK()) {
                    notifyStatus(TxStatus.CONFIRMED, "Match created on Monad!", receipt.getTransactionHash());
                    return BigInteger.ONE; // In production: decode MatchCreated event matchId
                }
                notifyStatus(TxStatus.FAILED, "Failed to create match", receipt.getTransactionHash());
                return BigInteger.ZERO;
            } catch (Exception e) {
                notifyStatus(TxStatus.FAILED, e.getMessage(), null);
                return BigInteger.ZERO;
            }
        }, executor);
    }

    /**
     * Deposits native MON wager into match escrow.
     */
    public CompletableFuture<Boolean> depositWagerAsync(BigInteger matchId, BigInteger wagerAmountWei) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (txManager == null) throw new IllegalStateException("Wallet not initialized");

                notifyStatus(TxStatus.PREPARING, "Depositing wager into escrow...", null);

                Function function = new Function(
                    "depositWager",
                    Collections.singletonList(new Uint256(matchId)),
                    Collections.emptyList()
                );

                String encoded = FunctionEncoder.encode(function);
                notifyStatus(TxStatus.PENDING, "Escrowing " + wagerAmountWei + " wei MON...", null);

                TransactionReceipt receipt = txManager.executeTransaction(
                    BigInteger.valueOf(50_000_000_000L),
                    BigInteger.valueOf(250_000L),
                    wagerContractAddress,
                    encoded,
                    wagerAmountWei // Native MON value sent with transaction
                );

                if (receipt.isStatusOK()) {
                    notifyStatus(TxStatus.CONFIRMED, "Wager deposited successfully!", receipt.getTransactionHash());
                    return true;
                }
                notifyStatus(TxStatus.FAILED, "Wager deposit failed", receipt.getTransactionHash());
                return false;
            } catch (Exception e) {
                notifyStatus(TxStatus.FAILED, e.getMessage(), null);
                return false;
            }
        }, executor);
    }

    /**
     * Locks the match once all racers have deposited.
     */
    public CompletableFuture<Boolean> lockMatchAsync(BigInteger matchId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (txManager == null) throw new IllegalStateException("Wallet not initialized");

                Function function = new Function(
                    "lockMatch",
                    Collections.singletonList(new Uint256(matchId)),
                    Collections.emptyList()
                );

                String encoded = FunctionEncoder.encode(function);
                notifyStatus(TxStatus.PENDING, "Locking match escrow...", null);

                TransactionReceipt receipt = txManager.executeTransaction(
                    BigInteger.valueOf(50_000_000_000L),
                    BigInteger.valueOf(200_000L),
                    wagerContractAddress,
                    encoded,
                    BigInteger.ZERO
                );

                if (receipt.isStatusOK()) {
                    notifyStatus(TxStatus.CONFIRMED, "Match locked. Race in progress!", receipt.getTransactionHash());
                    return true;
                }
                return false;
            } catch (Exception e) {
                notifyStatus(TxStatus.FAILED, e.getMessage(), null);
                return false;
            }
        }, executor);
    }

    /**
     * Reports race finish results and triggers automatic escrow payout to winner.
     */
    public CompletableFuture<Boolean> reportResultAsync(BigInteger matchId, List<String> rankedPlayers) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (txManager == null) throw new IllegalStateException("Wallet not initialized");

                notifyStatus(TxStatus.PREPARING, "Reporting winner and paying out pool...", null);

                List<Address> addressList = new ArrayList<>();
                for (String addr : rankedPlayers) {
                    addressList.add(new Address(addr));
                }

                Function function = new Function(
                    "reportResult",
                    Arrays.asList(
                        new Uint256(matchId),
                        new DynamicArray<>(Address.class, addressList)
                    ),
                    Collections.emptyList()
                );

                String encoded = FunctionEncoder.encode(function);
                notifyStatus(TxStatus.PENDING, "Paying out winner on Monad...", null);

                TransactionReceipt receipt = txManager.executeTransaction(
                    BigInteger.valueOf(50_000_000_000L),
                    BigInteger.valueOf(350_000L),
                    wagerContractAddress,
                    encoded,
                    BigInteger.ZERO
                );

                if (receipt.isStatusOK()) {
                    notifyStatus(TxStatus.CONFIRMED, "Winner paid out successfully!", receipt.getTransactionHash());
                    return true;
                }
                notifyStatus(TxStatus.FAILED, "Payout failed", receipt.getTransactionHash());
                return false;
            } catch (Exception e) {
                notifyStatus(TxStatus.FAILED, e.getMessage(), null);
                return false;
            }
        }, executor);
    }

    /**
     * Claims a refund if the match stays locked past timeout without a reported result.
     */
    public CompletableFuture<Boolean> claimRefundAsync(BigInteger matchId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (txManager == null) throw new IllegalStateException("Wallet not initialized");

                Function function = new Function(
                    "claimRefund",
                    Collections.singletonList(new Uint256(matchId)),
                    Collections.emptyList()
                );

                String encoded = FunctionEncoder.encode(function);
                notifyStatus(TxStatus.PENDING, "Claiming escrow refund...", null);

                TransactionReceipt receipt = txManager.executeTransaction(
                    BigInteger.valueOf(50_000_000_000L),
                    BigInteger.valueOf(250_000L),
                    wagerContractAddress,
                    encoded,
                    BigInteger.ZERO
                );

                if (receipt.isStatusOK()) {
                    notifyStatus(TxStatus.CONFIRMED, "Refund claimed successfully!", receipt.getTransactionHash());
                    return true;
                }
                return false;
            } catch (Exception e) {
                notifyStatus(TxStatus.FAILED, e.getMessage(), null);
                return false;
            }
        }, executor);
    }

    public void shutdown() {
        executor.shutdown();
    }
}
