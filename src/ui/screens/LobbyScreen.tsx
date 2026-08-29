import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useWeb3 } from '../../web3/Web3Context';
import { MAPS } from '../../game/maps/MapData';
import { BotDifficulty } from '../../types/game';
import { SoundEngine } from '../../game/systems/SoundEngine';
import { PixelArtVehicles, VehicleSkinId } from '../../game/graphics/PixelArtVehicles';
import { ArrowLeft, Play, Users, Coins, CheckCircle, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { MONAD_TESTNET } from '../../web3/monadChain';

interface LobbyScreenProps {
  onBack: () => void;
  onLaunchGame: () => void;
  onOpenMultiplayer?: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onBack, onLaunchGame, onOpenMultiplayer }) => {
  const { garage, selectedMap, gameMode, botCount, setBotCount, botDifficulty, setBotDifficulty } = useGameStore();
  const { account, monBalance, connectWallet, sendWagerBidTransaction } = useWeb3();
  const [countdown, setCountdown] = useState<number | null>(null);

  // Pre-match Bidding / Wagering state
  const [wagerBidAmount, setWagerBidAmount] = useState<string>('0.5');
  const [isBidPlaced, setIsBidPlaced] = useState<boolean>(false);
  const [bidTxPending, setBidTxPending] = useState<boolean>(false);
  const [bidTxHash, setBidTxHash] = useState<string | null>(null);
  const [bidError, setBidError] = useState<string | null>(null);

  const currentMap = MAPS[selectedMap] || MAPS['neon_city'];

  const botConfigs: { name: string; skin: VehicleSkinId; difficulty: BotDifficulty }[] = [
    { name: 'Sheriff Byte', skin: 'police' as VehicleSkinId, difficulty: botDifficulty },
    { name: 'Wave Rider', skin: 'surf' as VehicleSkinId, difficulty: botDifficulty },
    { name: 'Red Comet', skin: 'red' as VehicleSkinId, difficulty: botDifficulty },
    { name: 'Lord Bigfoot', skin: 'bigfoot' as VehicleSkinId, difficulty: botDifficulty },
    { name: 'Shadow Ghost', skin: 'dark_m' as VehicleSkinId, difficulty: botDifficulty },
    { name: 'Agro Titan', skin: 'harvester' as VehicleSkinId, difficulty: botDifficulty },
  ].slice(0, botCount);

  const handlePlaceBid = async () => {
    if (!account) {
      await connectWallet();
      return;
    }

    setBidTxPending(true);
    setBidError(null);

    const res = await sendWagerBidTransaction(wagerBidAmount);
    setBidTxPending(false);

    if (res.success) {
      setIsBidPlaced(true);
      if (res.txHash) setBidTxHash(res.txHash);
    } else {
      setBidError(res.error || 'Failed to complete transaction on Monad Testnet');
    }
  };

  const handleStartCountdown = () => {
    setCountdown(3);
    const sound = SoundEngine.getInstance();
    sound.playCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    const sound = SoundEngine.getInstance();

    if (countdown > 0) {
      const timer = setTimeout(() => {
        const next = countdown - 1;
        setCountdown(next);
        sound.playCountdown(next);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      const timer = setTimeout(() => {
        onLaunchGame();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [countdown, onLaunchGame]);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 space-y-6 bg-[#161226] relative overflow-hidden select-none font-['Press_Start_2P',sans-serif]">
      {/* Checkerboard Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#261f3d_1px,transparent_1px),linear-gradient(to_right,#1d1830_24px,#141021_24px),linear-gradient(to_bottom,#1d1830_24px,#141021_24px)] bg-[size:48px_48px] opacity-70 pointer-events-none"></div>

      {/* 3-2-1-GO Fullscreen Animated Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="text-center space-y-4">
            <div className="text-8xl md:text-9xl text-yellow-400 animate-bounce drop-shadow-[0_0_50px_rgba(250,204,21,0.8)]">
              {countdown === 0 ? 'GO!' : countdown}
            </div>
            <div className="text-xs uppercase tracking-widest text-cyber-cyan">
              {countdown === 0 ? 'ENGINES FULL THROTTLE' : 'INITIALIZING STARTING GRID...'}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between z-10 relative">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] active:translate-y-1 text-white border-2 border-[#d965a9] shadow-[0_4px_0_#5c1d43] flex items-center justify-center transition-all"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3]" />
        </button>

        <div className="text-center">
          <h1 className="text-base md:text-xl text-white tracking-wide drop-shadow">MATCH LOBBY</h1>
          <p className="text-[10px] text-cyber-cyan mt-1 font-['Silkscreen',sans-serif]">{currentMap.name}</p>
        </div>

        {onOpenMultiplayer && (
          <button
            onClick={onOpenMultiplayer}
            className="px-3 py-2.5 rounded-xl bg-[#8354fe] hover:bg-[#9d6fff] text-white text-[8px] flex items-center gap-1.5 border border-[#a855f7] shadow"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PVP ROOMS</span>
          </button>
        )}
      </div>

      {/* Pre-Match On-Chain Wagering & Bidding Banner */}
      <div className="max-w-5xl mx-auto w-full bg-[#201838] border-2 border-[#8354fe] rounded-3xl p-4 md:p-5 shadow-[0_0_30px_rgba(131,84,254,0.3)] z-10 relative space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#8354fe]/30 rounded-xl text-yellow-300">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs text-purple-300">PRE-MATCH MONAD WAGER / BID</h3>
              <span className="text-[8px] text-gray-400 font-mono">Win 100% of the escrow prize pool on victory!</span>
            </div>
          </div>
          <span className="text-[9px] text-yellow-400 font-mono">Wallet Balance: {monBalance} MON</span>
        </div>

        {bidError && (
          <div className="p-3 bg-red-500/20 border border-red-500 rounded-xl text-red-300 text-[8px] flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{bidError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 flex items-center gap-2 w-full">
            <span className="text-[8px] text-gray-300 font-sans">BID AMOUNT:</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="50"
              value={wagerBidAmount}
              disabled={isBidPlaced || bidTxPending}
              onChange={(e) => setWagerBidAmount(e.target.value)}
              className="flex-1 bg-[#161124] border border-[#4c3a7a] focus:border-[#a855f7] rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
            />
            <span className="px-3 py-2 bg-[#8354fe]/25 border border-[#a855f7] rounded-xl text-[9px] text-purple-300 font-bold">
              MON
            </span>
          </div>

          <button
            onClick={handlePlaceBid}
            disabled={bidTxPending || isBidPlaced}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-[8px] font-sans transition-all flex items-center justify-center gap-2 ${
              isBidPlaced
                ? 'bg-green-500/20 text-green-300 border border-green-500'
                : 'bg-[#eab308] hover:bg-[#ca8a04] text-black font-bold border border-yellow-300 shadow-[0_4px_0_#a16207]'
            }`}
          >
            {bidTxPending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> SIGNING ON MONAD...
              </>
            ) : isBidPlaced ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-green-400" /> {wagerBidAmount} MON BID CONFIRMED ✓
              </>
            ) : (
              <>
                <Coins className="w-3.5 h-3.5" /> SEND {wagerBidAmount} MON BID
              </>
            )}
          </button>
        </div>

        {bidTxHash && (
          <div className="pt-1 flex items-center justify-end">
            <a
              href={`${MONAD_TESTNET.blockExplorers.default.url}/tx/${bidTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-[8px] font-mono text-purple-300 hover:text-white flex items-center gap-1 underline"
            >
              View Transaction on MonadExplorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Main Roster Grid */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 z-10 relative">
        {/* Player Card */}
        <div className="bg-[#484064] border-4 border-[#e11d48] rounded-3xl p-6 shadow-[0_0_25px_rgba(225,29,72,0.5)] space-y-4 flex flex-col items-center text-center">
          <div className="bg-[#e11d48] text-white text-[9px] px-3 py-1 rounded-full uppercase tracking-wider">
            YOU (PLAYER 1)
          </div>
          <div className="w-20 h-28 flex items-center justify-center">
            <LobbyVehiclePreview skinId={(garage.skinId as VehicleSkinId) || 'red'} />
          </div>
          <div className="text-sm text-white">{garage.pilotName}</div>
          <div className="text-[9px] text-gray-300 font-mono">
            {isBidPlaced ? `⚡ ESCROW: ${wagerBidAmount} MON` : 'STATUS: READY TO DEPLOY'}
          </div>
        </div>

        {/* Competitor AI Roster */}
        <div className="md:col-span-2 bg-[#251e3d] border-2 border-[#3d3261] rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-xs text-white">OPPONENT ROSTER ({botConfigs.length})</h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-400">DIFFICULTY:</span>
              <span className="text-[9px] text-cyber-cyan uppercase">{botDifficulty}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {botConfigs.map((bot, idx) => (
              <div
                key={idx}
                className="bg-[#1b152d] border border-[#3d3261] rounded-2xl p-3 flex flex-col items-center text-center space-y-2"
              >
                <div className="w-14 h-20 flex items-center justify-center">
                  <LobbyVehiclePreview skinId={bot.skin} />
                </div>
                <div className="text-[10px] text-white">{bot.name}</div>
                <div className="text-[8px] text-gray-400 uppercase">AI BOT</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Start Button Container */}
      <div className="max-w-md mx-auto w-full pt-4 z-10 relative">
        <button
          onClick={handleStartCountdown}
          className="w-full py-4 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] active:translate-y-1 text-white text-sm tracking-wider border-2 border-[#d965a9] shadow-[0_6px_0_#5c1d43] transition-all flex items-center justify-center gap-3"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>START MATCH NOW</span>
        </button>
      </div>
    </div>
  );
};

const LobbyVehiclePreview: React.FC<{ skinId: VehicleSkinId }> = ({ skinId }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
    PixelArtVehicles.drawVehicle(ctx, skinId, 1.3);
    ctx.restore();
  }, [skinId]);

  return <canvas ref={canvasRef} width={64} height={90} className="pointer-events-none" />;
};
