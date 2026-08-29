import React, { useRef, useEffect } from 'react';
import { Play, Wrench, MapPin, ShoppingBag, CheckSquare, Trophy, Sparkles, ChevronRight, Zap, Users, Coins } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { useWeb3 } from '../../web3/Web3Context';
import { KART_CLASSES } from '../../game/config/kartClasses';
import { MAPS } from '../../game/maps/MapData';
import { PixelArtVehicles, VehicleSkinId } from '../../game/graphics/PixelArtVehicles';

const MiniVehicleCanvas: React.FC<{ skinId: VehicleSkinId }> = ({ skinId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
    PixelArtVehicles.drawVehicle(ctx, skinId, 1.0);
    ctx.restore();
  }, [skinId]);

  return <canvas ref={canvasRef} width={56} height={76} className="pointer-events-none" />;
};

interface MainMenuProps {
  onNavigate: (screen: string) => void;
  onQuickPlay: () => void;
  onOpenMultiplayer: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onNavigate, onQuickPlay, onOpenMultiplayer }) => {
  const { stats, garage, selectedMap, gameMode, quests } = useGameStore();
  const { smashBalance, account, connectWallet } = useWeb3();
  const currentKart = KART_CLASSES[garage.chassis];
  const currentMap = MAPS[selectedMap] || MAPS['neon_city'];

  const pendingQuests = quests.filter((q) => q.completed && !q.claimed).length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
      {/* Pilot Profile Banner */}
      <div className="bg-gradient-to-r from-monad-card via-monad-dark to-monad-card border border-monad-border rounded-3xl p-6 md:p-8 shadow-glow-purple relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-monad-purple/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Left: Pilot Info & Kart */}
        <div className="flex items-center gap-5 z-10">
          <div className="w-20 h-24 rounded-2xl bg-[#484064] border-2 border-[#2b2542] shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center relative">
            <MiniVehicleCanvas skinId={(garage.skinId as any) || 'red'} />
            <div className="absolute -bottom-2 -right-2 bg-cyber-cyan text-monad-dark font-['Press_Start_2P',sans-serif] text-[9px] px-1.5 py-0.5 rounded shadow">
              L{stats.level}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-['Press_Start_2P',sans-serif] text-sm text-white tracking-wide">{garage.pilotName}</h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
              <span>Wins: <strong className="text-cyber-green">{stats.wins}</strong></span>
              <span>Kills: <strong className="text-cyber-pink">{stats.totalKills}</strong></span>
              <span>Matches: <strong className="text-white">{stats.totalMatches}</strong></span>
            </div>
            {/* XP Progress Bar */}
            <div className="w-48 md:w-64 bg-monad-dark h-2 rounded-full overflow-hidden border border-monad-border mt-2">
              <div
                className="bg-gradient-to-r from-monad-purple to-cyber-cyan h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (stats.xp / stats.xpToNext) * 100)}%` }}
              ></div>
            </div>
            <div className="text-[10px] font-mono text-gray-400">
              XP: {stats.xp} / {stats.xpToNext}
            </div>
          </div>
        </div>

        {/* Right: Quick Launch & Multiplayer Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full md:w-auto">
          <button
            onClick={onOpenMultiplayer}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-[#8354fe] to-[#a855f7] hover:opacity-95 text-white font-['Press_Start_2P',sans-serif] text-xs tracking-wider shadow-[0_0_20px_rgba(131,84,254,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-2 border border-[#c084fc]"
          >
            <Users className="w-4 h-4 text-yellow-300" />
            <span>ONLINE PVP / WAGER</span>
          </button>

          <button
            onClick={onQuickPlay}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-monad-purple to-cyber-cyan hover:opacity-95 text-white font-display text-lg tracking-wider shadow-glow-purple hover:scale-105 transition-all flex items-center justify-center gap-2 group"
          >
            <Play className="w-5 h-5 fill-white group-hover:translate-x-0.5 transition-transform" />
            <span>START MATCH</span>
          </button>
        </div>
      </div>

      {/* Grid of Main Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Online Multiplayer Card */}
        <div
          onClick={onOpenMultiplayer}
          className="group bg-gradient-to-br from-[#8354fe]/30 to-[#1a142e] border-2 border-[#8354fe] p-6 rounded-3xl cursor-pointer hover:-translate-y-1.5 transition-all shadow-[0_0_25px_rgba(131,84,254,0.4)] relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3.5 rounded-2xl bg-[#8354fe]/40 text-yellow-300 border border-[#a855f7] group-hover:scale-110 transition-transform">
              <Coins className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-[8px] font-['Press_Start_2P',sans-serif]">
              MONAD PVP
            </span>
          </div>
          <h3 className="font-display text-xl text-white mb-1.5">Online Multiplayer & Wager</h3>
          <p className="text-gray-300 text-xs font-sans mb-4">
            Create 6-digit room lobbies, invite friends, place MON wagers, or race casual 4-player PvP!
          </p>
          <div className="font-mono text-xs text-yellow-400 flex items-center gap-1 font-bold">
            <span>⚔️ Create / Join Room →</span>
          </div>
        </div>

        {/* Garage Customization */}
        <div
          onClick={() => onNavigate('garage')}
          className="group bg-monad-card/90 border border-monad-border hover:border-monad-purple p-6 rounded-3xl cursor-pointer hover:-translate-y-1.5 transition-all shadow-lg relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3.5 rounded-2xl bg-monad-purple/20 text-monad-purple border border-monad-purple/30 group-hover:scale-110 transition-transform">
              <Wrench className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-display text-xl text-white mb-1.5">Garage & Tuning</h3>
          <p className="text-gray-400 text-xs font-sans mb-4">
            Swap kart chassis, configure neon underglow, body paint, and inspect stat radar ratings.
          </p>
          <div className="font-mono text-xs text-cyber-cyan flex items-center gap-1">
            <span>Current: {currentKart.name}</span>
          </div>
        </div>

        {/* Arena Browser */}
        <div
          onClick={() => onNavigate('map_select')}
          className="group bg-monad-card/90 border border-monad-border hover:border-cyber-cyan p-6 rounded-3xl cursor-pointer hover:-translate-y-1.5 transition-all shadow-lg relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3.5 rounded-2xl bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-display text-xl text-white mb-1.5">Select Arena</h3>
          <p className="text-gray-400 text-xs font-sans mb-4">
            Explore 5 unique battle tracks: Neon City, Desert Dunes, Cryo Ice, Hazard Plant, and Monad Nexus.
          </p>
          <div className="font-mono text-xs text-cyber-cyan flex items-center gap-1">
            <span>5 Tracks Available</span>
          </div>
        </div>

        {/* Black Market Shop */}
        <div
          onClick={() => onNavigate('shop')}
          className="group bg-monad-card/90 border border-monad-border hover:border-yellow-400 p-6 rounded-3xl cursor-pointer hover:-translate-y-1.5 transition-all shadow-lg relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3.5 rounded-2xl bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-display text-xl text-white mb-1.5">Black Market</h3>
          <p className="text-gray-400 text-xs font-sans mb-4">
            Unlock new karts, high-tech neon skins, and cosmetic underglow using coins or $SMASH tokens.
          </p>
          <div className="font-mono text-xs text-yellow-400 flex items-center gap-1">
            <span>Balance: {smashBalance} $SMASH</span>
          </div>
        </div>

        {/* Daily Quests */}
        <div
          onClick={() => onNavigate('quests')}
          className="group bg-monad-card/90 border border-monad-border hover:border-cyber-green p-6 rounded-3xl cursor-pointer hover:-translate-y-1.5 transition-all shadow-lg relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3.5 rounded-2xl bg-cyber-green/20 text-cyber-green border border-cyber-green/30 group-hover:scale-110 transition-transform relative">
              <CheckSquare className="w-6 h-6" />
              {pendingQuests > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyber-pink rounded-full animate-ping"></span>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-display text-xl text-white mb-1.5">Daily Quests</h3>
          <p className="text-gray-400 text-xs font-sans mb-4">
            Complete daily battle objectives to earn extra coins and on-chain Monad Testnet token bounties.
          </p>
          <div className="font-mono text-xs text-cyber-green flex items-center gap-1">
            <span>{pendingQuests} Quests Ready to Claim</span>
          </div>
        </div>

        {/* Rankings & Leaderboards */}
        <div
          onClick={() => onNavigate('leaderboard')}
          className="group bg-monad-card/90 border border-monad-border hover:border-cyber-pink p-6 rounded-3xl cursor-pointer hover:-translate-y-1.5 transition-all shadow-lg relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3.5 rounded-2xl bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/30 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-display text-xl text-white mb-1.5">Rankings & Records</h3>
          <p className="text-gray-400 text-xs font-sans mb-4">
            View high-scoring battle aces and on-chain season champions on Monad Testnet.
          </p>
          <div className="font-mono text-xs text-cyber-pink flex items-center gap-1">
            <span>Seasonal Ladder Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
