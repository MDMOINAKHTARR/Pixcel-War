import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../web3/Web3Context';
import { NetworkManager } from '../../game/systems/NetworkManager';
import { Users, Coins, Copy, Check, Play, RefreshCw, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { MONAD_TESTNET } from '../../web3/monadChain';

interface OnlineLobbyScreenProps {
  onBack: () => void;
  onStartRace: (trackId: string, isOnline: boolean) => void;
}

export const OnlineLobbyScreen: React.FC<OnlineLobbyScreenProps> = ({ onBack, onStartRace }) => {
  const { account, monBalance, connectWallet, sendWagerBidTransaction } = useWeb3();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('neon_city');
  const [wagerAmount, setWagerAmount] = useState<string>('0');
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [playerName, setPlayerName] = useState<string>('SpeedMaster');

  // Lobby state from server
  const [inLobby, setInLobby] = useState<boolean>(false);
  const [currentLobby, setCurrentLobby] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [txPending, setTxPending] = useState<boolean>(false);
  const [txSuccess, setTxSuccess] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const net = NetworkManager.getInstance();

  useEffect(() => {
    net.connect();

    net.setCallbacks({
      onRoomCreated: (code) => {
        setInLobby(true);
        setErrorMsg(null);
      },
      onRoomJoined: (code) => {
        setInLobby(true);
        setErrorMsg(null);
      },
      onLobbyState: (data) => {
        setCurrentLobby(data);
      },
      onJoinError: (err) => {
        setErrorMsg(err);
      },
      onRaceStarting: (trackId) => {
        // Zero bots for pure PvP multiplayer race
        onStartRace(trackId, true);
      },
    });

    return () => {
      // keep connection open
    };
  }, [net, onStartRace]);

  const handleCreateRoom = async () => {
    try {
      setErrorMsg(null);
      if (wagerAmount !== '0' && !account) {
        await connectWallet();
      }
      net.createRoom({
        trackId: selectedTrack,
        wagerAmount,
        maxPlayers,
        playerName,
        walletAddress: account || undefined,
      });
      setInLobby(true);
    } catch (err: any) {
      console.error('Error creating room lobby:', err);
      setErrorMsg(err?.message || 'Failed to create room lobby. Please try again.');
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) {
      setErrorMsg('Please enter a 6-digit room code');
      return;
    }
    try {
      setErrorMsg(null);
      net.joinRoom(roomCodeInput.toUpperCase().trim(), {
        playerName,
        walletAddress: account || undefined,
      });
      setInLobby(true);
    } catch (err: any) {
      console.error('Error joining room lobby:', err);
      setErrorMsg(err?.message || 'Failed to join room lobby.');
    }
  };

  const handleDepositWager = async () => {
    if (!account) {
      await connectWallet();
      return;
    }

    setTxPending(true);
    setErrorMsg(null);

    const requiredWager = currentLobby?.wagerAmount || '0.5';
    const result = await sendWagerBidTransaction(requiredWager);
    setTxPending(false);

    if (result.success) {
      setTxSuccess(true);
      if (result.txHash) setTxHash(result.txHash);
      net.confirmDeposit(account);
    } else {
      setErrorMsg(result.error || 'Escrow deposit transaction failed on Monad Testnet');
    }
  };

  const handleStartGame = () => {
    net.startRace();
  };

  const copyRoomCode = () => {
    if (currentLobby?.roomCode) {
      navigator.clipboard.writeText(currentLobby.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const isHost = currentLobby?.players?.find((p: any) => p.isHost)?.id === net.localPlayerId;
  const allPaidReady = currentLobby?.players?.every((p: any) => p.ready);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 md:p-8 bg-[#161224] relative overflow-hidden select-none animate-fadeIn font-['Press_Start_2P',sans-serif]">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#261f3d_1px,transparent_1px),linear-gradient(to_right,#1d1830_24px,#141021_24px),linear-gradient(to_bottom,#1d1830_24px,#141021_24px)] bg-[size:48px_48px] opacity-70 pointer-events-none"></div>

      {/* Header */}
      <div className="text-center pt-2 relative z-10 space-y-2">
        <h1 className="text-xl md:text-2xl tracking-widest text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
          ONLINE PVP (NO BOTS)
        </h1>
        <p className="text-gray-400 text-xs font-mono">100% Real-Time Human Racing & On-Chain Monad Wagering</p>
      </div>

      <div className="max-w-3xl mx-auto w-full my-auto z-10">
        {!inLobby ? (
          /* Matchmaking Tab Selector */
          <div className="bg-[#241f38] border-4 border-[#3d3261] rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex bg-[#1b152d] border border-[#4c3a7a] p-1 rounded-2xl gap-2">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'create' ? 'bg-[#8354fe] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" /> CREATE ROOM
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'join' ? 'bg-[#8354fe] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Coins className="w-4 h-4" /> JOIN BY CODE
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-xl text-red-300 text-[9px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
              </div>
            )}

            {activeTab === 'create' ? (
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-[9px] text-purple-300 font-sans">PILOT NAME</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full bg-[#1b152d] border border-[#4c3a7a] rounded-xl px-4 py-2.5 text-white mt-1 outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-purple-300 font-sans">TRACK</label>
                    <select
                      value={selectedTrack}
                      onChange={(e) => setSelectedTrack(e.target.value)}
                      className="w-full bg-[#1b152d] border border-[#4c3a7a] rounded-xl px-4 py-2.5 text-white mt-1 outline-none text-xs"
                    >
                      <option value="neon_city">Blocky Town Plaza</option>
                      <option value="desert_dunes">Desert Canyon</option>
                      <option value="cryo_colosseum">Snowy Peak</option>
                      <option value="volcano_canyon">Volcanic Canyon</option>
                      <option value="industrial_hazard">Industrial Apex</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-purple-300 font-sans">MAX PLAYERS (NO BOTS)</label>
                    <select
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(Number(e.target.value))}
                      className="w-full bg-[#1b152d] border border-[#4c3a7a] rounded-xl px-4 py-2.5 text-white mt-1 outline-none text-xs"
                    >
                      <option value={2}>2 Players (1v1)</option>
                      <option value={3}>3 Players</option>
                      <option value={4}>4 Players Max</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-purple-300 font-sans">WAGER ENTRY (MON PER RACER)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={wagerAmount}
                      onChange={(e) => setWagerAmount(e.target.value)}
                      className="w-full bg-[#1b152d] border border-[#4c3a7a] rounded-xl px-4 py-2.5 text-white outline-none text-xs"
                    />
                    <span className="px-4 py-2.5 bg-[#8354fe]/20 text-purple-300 border border-[#a855f7] rounded-xl text-xs font-bold">
                      MON
                    </span>
                  </div>
                  <span className="text-[8px] text-gray-400">Set to 0 for Free-to-Play casual match</span>
                </div>

                <button
                  onClick={handleCreateRoom}
                  className="w-full py-4 bg-[#22c55e] hover:bg-[#16a34a] rounded-2xl text-white text-xs border-2 border-[#86efac] shadow-[0_5px_0_#15803d] transition-all font-sans"
                >
                  🚀 CREATE ROOM LOBBY
                </button>
              </div>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-[9px] text-purple-300 font-sans">PILOT NAME</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full bg-[#1b152d] border border-[#4c3a7a] rounded-xl px-4 py-2.5 text-white mt-1 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-purple-300 font-sans">ENTER 6-DIGIT ROOM CODE</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 7X9K2P"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    className="w-full bg-[#1b152d] border-2 border-[#8354fe] focus:border-[#a855f7] rounded-xl px-4 py-3 text-white tracking-widest text-center text-lg mt-1 outline-none font-bold font-sans"
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  className="w-full py-4 bg-[#8354fe] hover:bg-[#9d6fff] rounded-2xl text-white text-xs border-2 border-[#a855f7] shadow-[0_5px_0_#581c87] transition-all font-sans"
                >
                  🚪 JOIN ROOM
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Inside Live Room Lobby */
          <div className="bg-[#241f38] border-4 border-[#8354fe] rounded-3xl p-6 shadow-2xl space-y-5 text-white">
            {/* Room Code Badge */}
            <div className="flex items-center justify-between bg-[#1b152d] border border-[#4c3a7a] p-4 rounded-2xl">
              <div>
                <span className="text-[8px] text-gray-400">ROOM CODE (SHARE WITH FRIENDS)</span>
                <h2 className="text-xl text-purple-300 tracking-wider font-sans font-bold">
                  {currentLobby?.roomCode}
                </h2>
              </div>
              <button
                onClick={copyRoomCode}
                className="px-4 py-2.5 bg-[#2d2447] hover:bg-[#3d3261] rounded-xl text-xs flex items-center gap-2 border border-[#4c3a7a]"
              >
                {copiedCode ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'COPIED!' : 'COPY CODE'}
              </button>
            </div>

            {/* Room Info Bar */}
            <div className="flex justify-between items-center text-[9px] text-gray-300 bg-[#161124] p-3 rounded-xl">
              <span>Track: <b className="text-white">{currentLobby?.trackId}</b></span>
              <span>Wager: <b className="text-yellow-400">{currentLobby?.wagerAmount} MON</b></span>
              <span>Humans: <b className="text-white">{currentLobby?.players?.length || 1}/{currentLobby?.maxPlayers || 4}</b></span>
            </div>

            {/* Players List (Pure Humans) */}
            <div className="space-y-2.5">
              <span className="text-[9px] text-purple-300">CONNECTED RACERS (NO BOTS)</span>
              {currentLobby?.players?.map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-[#1b152d] border border-[#3d3261] p-3 rounded-xl flex items-center justify-between text-[9px]"
                >
                  <div className="flex items-center gap-2">
                    <span>{p.isHost ? '👑' : '🏎️'}</span>
                    <span className="text-white font-bold">{p.name}</span>
                    {p.wallet && (
                      <span className="text-[8px] text-gray-400 font-mono">
                        ({p.wallet.slice(0, 6)}...{p.wallet.slice(-4)})
                      </span>
                    )}
                  </div>
                  <div>
                    {p.ready ? (
                      <span className="px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/40 rounded-lg text-[8px] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> READY
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded-lg text-[8px]">
                        ESCROW PENDING
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Deposit Required for Non-Host / Non-Deposited Player in Wager Room */}
            {currentLobby?.wagerAmount !== '0' && (
              <div className="bg-[#1b152d] border border-yellow-500/30 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-yellow-300">ON-CHAIN ESCROW TRANSACTION</span>
                  <span className="text-xs text-yellow-400 font-bold">{currentLobby?.wagerAmount} MON</span>
                </div>
                <button
                  onClick={handleDepositWager}
                  disabled={txPending || txSuccess}
                  className="w-full py-3 bg-[#eab308] hover:bg-[#ca8a04] disabled:bg-green-800 text-black font-bold rounded-xl text-[9px] font-sans transition-all flex items-center justify-center gap-2"
                >
                  {txPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> SIGNING & BROADCASTING ON MONAD...
                    </>
                  ) : txSuccess ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-green-300" /> DEPOSIT CONFIRMED ON-CHAIN ✓
                    </>
                  ) : (
                    <>
                      <Coins className="w-3.5 h-3.5" /> SEND {currentLobby?.wagerAmount} MON ESCROW TRANSACTION
                    </>
                  )}
                </button>

                {txHash && (
                  <div className="pt-1 flex items-center justify-end">
                    <a
                      href={`${MONAD_TESTNET.blockExplorers.default.url}/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[8px] font-mono text-purple-300 hover:text-white flex items-center gap-1 underline"
                    >
                      View on MonadExplorer <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Host Start Controls */}
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={!allPaidReady}
                className={`w-full py-4 rounded-2xl text-xs font-sans border-2 transition-all flex items-center justify-center gap-2 ${
                  allPaidReady
                    ? 'bg-[#22c55e] hover:bg-[#16a34a] text-white border-[#86efac] shadow-[0_5px_0_#15803d]'
                    : 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4" />
                {allPaidReady ? 'START MULTIPLAYER RACE' : 'WAITING FOR ALL HUMAN RACERS...'}
              </button>
            ) : (
              <div className="text-center text-[9px] text-gray-400 py-2">
                Waiting for the host to launch the race...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="z-10 pt-2">
        <button
          onClick={() => {
            if (inLobby) {
              setInLobby(false);
              net.disconnect();
            } else {
              onBack();
            }
          }}
          className="px-6 py-3 rounded-2xl bg-[#2b1f47] border border-[#483770] hover:bg-[#38285c] text-gray-300 text-xs transition-all font-sans cursor-pointer"
        >
          {inLobby ? 'LEAVE LOBBY' : 'BACK'}
        </button>
      </div>
    </div>
  );
};
