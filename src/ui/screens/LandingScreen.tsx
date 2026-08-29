import React from 'react';
import { Play, Users, Wrench, Settings, Sparkles, Trophy, Cpu } from 'lucide-react';
import { useWeb3 } from '../../web3/Web3Context';

interface LandingScreenProps {
  onStartGame: () => void;
  onOpenGarage: () => void;
  onOpenQuests: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onStartGame,
  onOpenGarage,
  onOpenQuests,
}) => {
  const { account, connectWallet, smashBalance } = useWeb3();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-between p-4 md:p-6 relative overflow-hidden bg-[#161226] select-none font-['Press_Start_2P',sans-serif]">
      {/* Dynamic Animated Checkerboard & Parallax Road Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#2d234d_1.5px,transparent_1.5px),linear-gradient(to_right,#201938_28px,#17122b_28px),linear-gradient(to_bottom,#201938_28px,#17122b_28px)] bg-[size:56px_56px] opacity-85 pointer-events-none"></div>

      {/* Moving Ambient Highway Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-gradient-to-r from-purple-600/20 via-pink-500/15 to-cyan-500/20 blur-[130px] rounded-full pointer-events-none animate-pulse"></div>

      {/* Center Title Logo Section */}
      <div className="max-w-2xl mx-auto w-full pt-4 md:pt-8 text-center space-y-6 relative z-10 flex flex-col items-center">
        {/* 3D Voxel Pixel Logo matching Pixel Wheels */}
        <div className="space-y-1 select-none transform hover:scale-105 transition-transform">
          {/* Green PIXEL Word */}
          <div className="text-3xl sm:text-5xl md:text-6xl tracking-widest text-[#22c55e] drop-shadow-[0_6px_0_#14532d] drop-shadow-[0_12px_20px_rgba(34,197,94,0.5)]">
            PIXEL
          </div>
          {/* Yellow/Orange WHEELS Word */}
          <div className="text-4xl sm:text-6xl md:text-7xl tracking-wider text-[#fbbf24] drop-shadow-[0_8px_0_#b45309] drop-shadow-[0_14px_24px_rgba(245,158,11,0.6)]">
            WHEELS
          </div>
          {/* Monad Testnet Sub-tag */}
          <div className="pt-2 font-['Silkscreen',sans-serif] text-xs uppercase tracking-widest text-cyber-cyan flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-ping"></span>
            <span>MONAD TESTNET ARCADE • 10,000 TPS</span>
          </div>
        </div>

        {/* Retro 3D Bevel Arcade Buttons with Clear Hierarchy */}
        <div className="w-full max-w-md space-y-3.5 pt-3">
          {/* PRIMARY BUTTON: ONE PLAYER (Highlighted with Gold Border and Larger Size) */}
          <button
            onClick={onStartGame}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#e11d48] to-[#be123c] hover:from-[#f43f5e] hover:to-[#e11d48] active:translate-y-1 text-white text-sm md:text-base tracking-wider border-4 border-[#fde047] shadow-[0_8px_0_#881337,0_12px_25px_rgba(225,29,72,0.6)] transition-all flex items-center justify-center gap-3 group"
          >
            <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
            <span>ONE PLAYER</span>
          </button>

          {/* SECONDARY BUTTON: MULTI PLAYER */}
          <button
            onClick={onStartGame}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] active:translate-y-1 text-white text-xs md:text-sm tracking-wider border-2 border-[#d965a9] shadow-[0_6px_0_#5c1d43] hover:shadow-[0_4px_0_#5c1d43] transition-all flex items-center justify-center gap-3"
          >
            <Users className="w-4 h-4" />
            <span>MULTI PLAYER</span>
          </button>

          {/* SECONDARY BUTTON: GARAGE / VEHICLES */}
          <button
            onClick={onOpenGarage}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] active:translate-y-1 text-white text-xs md:text-sm tracking-wider border-2 border-[#d965a9] shadow-[0_6px_0_#5c1d43] hover:shadow-[0_4px_0_#5c1d43] transition-all flex items-center justify-center gap-3"
          >
            <Wrench className="w-4 h-4" />
            <span>GARAGE / VEHICLES</span>
          </button>

          {/* TERTIARY BUTTON: WEB3 WALLET / QUESTS */}
          {!account ? (
            <button
              onClick={connectWallet}
              className="w-full py-3 px-6 rounded-2xl bg-[#581c87] hover:bg-[#6b21a8] active:translate-y-1 text-white text-xs tracking-wider border-2 border-[#9333ea] shadow-[0_5px_0_#3b0764] transition-all flex items-center justify-center gap-2.5"
            >
              <Sparkles className="w-4 h-4 text-cyber-cyan" />
              <span>CONNECT WALLET</span>
            </button>
          ) : (
            <button
              onClick={onOpenQuests}
              className="w-full py-3 px-6 rounded-2xl bg-[#1e1b4b] hover:bg-[#2e2970] active:translate-y-1 text-cyber-cyan text-xs tracking-wider border-2 border-[#4338ca] shadow-[0_5px_0_#171438] transition-all flex items-center justify-center gap-2.5"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>DAILY BOUNTIES & XP</span>
            </button>
          )}
        </div>
      </div>

      {/* Enlarged High-Contrast Status & Version Plaque */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10 pt-4">
        {/* Left Status Bar */}
        <div className="flex items-center gap-2 bg-[#251e3d] border-2 border-[#3d3261] px-4 py-2 rounded-xl text-gray-300 text-[10px] font-['Silkscreen',sans-serif] shadow">
          <Cpu className="w-3.5 h-3.5 text-cyber-green" />
          <span>ZERO-LAG ARCADE PHYSICS</span>
        </div>

        {/* Right High-Contrast Golden Plaque */}
        <div className="flex items-center gap-3 bg-[#241a0b] border-2 border-[#f59e0b] px-4 py-2 rounded-xl shadow-[0_4px_15px_rgba(245,158,11,0.3)]">
          <span className="text-[#fde047] text-[11px] font-bold">
            🪙 {smashBalance} $SMASH
          </span>
          <span className="text-[#e2e8f0] text-[10px] bg-[#451a03] px-2 py-0.5 rounded border border-[#b45309]">
            v0.25.0
          </span>
        </div>
      </div>
    </div>
  );
};
