import React, { useState } from 'react';
import { ArrowLeft, Trophy, Medal, Sparkles, Shield, Cpu } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface LeaderboardScreenProps {
  onBack: () => void;
}

interface LeaderboardEntry {
  rank: number;
  pilotName: string;
  wallet: string;
  wins: number;
  kills: number;
  score: number;
  kartClass: string;
  isPlayer?: boolean;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onBack }) => {
  const { stats, garage } = useGameStore();
  const [timeFilter, setTimeFilter] = useState<'season' | 'all_time'>('season');

  const leaderboards: LeaderboardEntry[] = [
    { rank: 1, pilotName: 'MonadOverlord', wallet: '0x71C...a89F', wins: 84, kills: 412, score: 98500, kartClass: 'Apex Drifter' },
    { rank: 2, pilotName: 'CyberViper', wallet: '0x32A...4B12', wins: 72, kills: 360, score: 87200, kartClass: 'Quantum Phantom' },
    { rank: 3, pilotName: 'NitroGhost', wallet: '0x99F...e10C', wins: 65, kills: 310, score: 79400, kartClass: 'Neon Scout' },
    { rank: 4, pilotName: garage.pilotName, wallet: '0xYOUR...WALLET', wins: stats.wins, kills: stats.totalKills, score: stats.wins * 1200 + stats.totalKills * 250, kartClass: garage.chassis, isPlayer: true },
    { rank: 5, pilotName: 'Goliath007', wallet: '0x44D...c831', wins: 41, kills: 230, score: 54100, kartClass: 'Goliath Tank' },
    { rank: 6, pilotName: 'PulseRacer', wallet: '0x12E...772A', wins: 33, kills: 180, score: 42300, kartClass: 'Monad Striker' },
    { rank: 7, pilotName: 'ZeroLag', wallet: '0x88B...391F', wins: 28, kills: 155, score: 37800, kartClass: 'Neon Scout' },
  ].sort((a, b) => b.score - a.score).map((entry, idx) => ({ ...entry, rank: idx + 1 }));

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-monad-card border border-monad-border text-gray-300 hover:text-white hover:bg-white/5 transition-all font-mono text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO HUB</span>
        </button>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-cyber-pink" />
          <h1 className="font-display text-2xl text-white tracking-wide">GLOBAL TOURNAMENT RANKINGS</h1>
        </div>
      </div>

      {/* Seasonal Tournament Banner */}
      <div className="bg-gradient-to-r from-monad-card via-monad-dark to-monad-card border border-monad-border rounded-3xl p-6 md:p-8 shadow-glow-purple flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/40 shadow-glow-pink">
            <Medal className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-mono text-cyber-cyan uppercase tracking-widest flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyber-green animate-ping"></span>
              On-Chain Verified • Monad Testnet
            </div>
            <h2 className="font-display text-2xl text-white">SEASON 1 CHAMPIONSHIP</h2>
            <p className="text-gray-400 text-xs font-sans">Top 100 pilots win exclusive Monad Gold Crown NFT badges and $SMASH rewards.</p>
          </div>
        </div>

        <div className="flex gap-2 bg-monad-card p-1 rounded-xl border border-monad-border font-mono text-xs">
          <button
            onClick={() => setTimeFilter('season')}
            className={`px-4 py-2 rounded-lg transition-all ${
              timeFilter === 'season' ? 'bg-monad-purple text-white font-bold shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Season 1 Ladder
          </button>
          <button
            onClick={() => setTimeFilter('all_time')}
            className={`px-4 py-2 rounded-lg transition-all ${
              timeFilter === 'all_time' ? 'bg-monad-purple text-white font-bold shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            All-Time Records
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-monad-card border border-monad-border rounded-3xl p-6 overflow-hidden shadow-lg space-y-3">
        <div className="grid grid-cols-12 text-[11px] font-mono text-gray-400 uppercase tracking-widest pb-3 border-b border-monad-border/60 px-4">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Pilot & Wallet</div>
          <div className="col-span-3">Chassis Class</div>
          <div className="col-span-2 text-center">Wins / Kills</div>
          <div className="col-span-2 text-right">Combat Score</div>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {leaderboards.map((entry) => (
            <div
              key={entry.rank}
              className={`grid grid-cols-12 items-center p-4 rounded-2xl border transition-all ${
                entry.isPlayer
                  ? 'bg-monad-purple/25 border-monad-purple text-white shadow-glow-purple'
                  : entry.rank === 1
                  ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300'
                  : entry.rank === 2
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : entry.rank === 3
                  ? 'bg-pink-500/10 border-pink-500/40 text-pink-300'
                  : 'bg-monad-dark/50 border-monad-border/60 text-gray-300 hover:border-gray-500'
              }`}
            >
              {/* Rank */}
              <div className="col-span-1 font-display text-base font-bold">
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
              </div>

              {/* Pilot */}
              <div className="col-span-4 space-y-0.5">
                <div className="font-display text-sm text-white flex items-center gap-1.5">
                  <span>{entry.pilotName}</span>
                  {entry.isPlayer && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-monad-purple text-white font-mono">YOU</span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 truncate">{entry.wallet}</div>
              </div>

              {/* Chassis */}
              <div className="col-span-3 text-gray-300 truncate">
                {entry.kartClass}
              </div>

              {/* Wins / Kills */}
              <div className="col-span-2 text-center">
                <span className="text-cyber-green font-bold">{entry.wins}W</span> / <span className="text-cyber-pink">{entry.kills}K</span>
              </div>

              {/* Score */}
              <div className="col-span-2 text-right font-display text-base text-cyber-cyan">
                {entry.score.toLocaleString()} PTS
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
