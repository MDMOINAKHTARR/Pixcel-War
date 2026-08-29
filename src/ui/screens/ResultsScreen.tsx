import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { MatchScore } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { useWeb3 } from '../../web3/Web3Context';
import { Trophy, Sparkles, Play, ArrowLeft, RefreshCw, ExternalLink, Flag } from 'lucide-react';

interface ResultsScreenProps {
  winner: MatchScore;
  allScores: MatchScore[];
  onPlayAgain: () => void;
  onReturnHub: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  winner,
  allScores,
  onPlayAgain,
  onReturnHub,
}) => {
  const { stats } = useGameStore();
  const { account, claimMatchReward, txLoading, lastTxHash } = useWeb3();

  const playerIdx = allScores.findIndex((s) => s.isPlayer);
  const playerScore = playerIdx >= 0 ? allScores[playerIdx] : allScores[0];
  const playerRank = playerIdx >= 0 ? playerIdx + 1 : 1;
  const isWinner = playerRank === 1;

  const [claimedReward, setClaimedReward] = useState<number | null>(null);

  useEffect(() => {
    if (isWinner) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#8354fe', '#00f0ff', '#ffe600', '#ff007a'],
      });
    }
  }, [isWinner]);

  const handleClaimOnChain = async () => {
    const res = await claimMatchReward(isWinner ? 5 : 2, isWinner);
    if (res.success) {
      setClaimedReward(res.amount);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 space-y-6 bg-[#161226] relative overflow-hidden select-none font-['Press_Start_2P',sans-serif] flex flex-col justify-between animate-fadeIn">
      {/* Checkerboard Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#261f3d_1px,transparent_1px),linear-gradient(to_right,#1d1830_24px,#141021_24px),linear-gradient(to_bottom,#1d1830_24px,#141021_24px)] bg-[size:48px_48px] opacity-70 pointer-events-none"></div>

      {/* Victory / Podium Header */}
      <div className="text-center space-y-3 z-10 relative pt-4">
        <h1 className="text-2xl md:text-4xl uppercase tracking-wider text-white drop-shadow-lg">
          {isWinner ? (
            <span className="text-yellow-400">🏁 1ST PLACE VICTORY!</span>
          ) : playerRank <= 3 ? (
            <span className="text-[#38bdf8]">🏆 PODIUM FINISH!</span>
          ) : (
            <span className="text-gray-300">RACE COMPLETED</span>
          )}
        </h1>
        <p className="text-cyber-cyan text-xs font-['Silkscreen',sans-serif]">
          CHAMPION: <strong className="text-white">{winner.name}</strong> • REWARD: +{playerScore.coinsCollected} 🪙
        </p>
      </div>

      {/* Match Stats Grid */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-2 sm:grid-cols-4 gap-4 z-10 relative">
        {[
          { label: 'YOUR POSITION', val: `${playerRank === 1 ? '🥇 1st' : playerRank === 2 ? '🥈 2nd' : playerRank === 3 ? '🥉 3rd' : `#${playerRank}`}`, color: 'text-yellow-400' },
          { label: 'LAPS', val: '3/3', color: 'text-rose-400' },
          { label: 'PTS', val: `${playerScore.score}`, color: 'text-cyan-400' },
          { label: 'COINS', val: `+${playerScore.coinsCollected}`, color: 'text-emerald-400' },
        ].map((item, idx) => (
          <div key={idx} className="bg-[#251e3d] border-2 border-[#3d3261] p-4 rounded-2xl text-center space-y-2 shadow-lg">
            <div className="text-[9px] text-gray-400 uppercase">{item.label}</div>
            <div className={`text-base md:text-xl ${item.color}`}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Race Results Podium Table */}
      <div className="max-w-4xl mx-auto w-full bg-[#251e3d] border-2 border-[#3d3261] rounded-3xl p-4 md:p-6 shadow-xl z-10 relative space-y-3">
        <div className="text-xs text-white pb-2 border-b border-white/10 flex items-center gap-2">
          <Flag className="w-4 h-4 text-yellow-400" /> RACE STANDINGS
        </div>
        <div className="space-y-2">
          {allScores.map((score, idx) => (
            <div
              key={score.id}
              className={`p-3 rounded-2xl flex items-center justify-between text-[10px] ${
                score.isPlayer
                  ? 'bg-[#e11d48]/20 border-2 border-[#e11d48]'
                  : 'bg-[#1b152d] border border-[#3d3261]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-yellow-400">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                <span className="text-white font-bold">{score.name}</span>
                {score.isPlayer && <span className="text-cyber-cyan text-[8px]">(YOU)</span>}
              </div>
              <div className="flex items-center gap-4 text-gray-300 font-mono">
                <span>PTS: <strong className="text-yellow-400">{score.score}</strong></span>
                <span>COINS: <strong className="text-emerald-400">+{score.coinsCollected}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 z-10 relative pt-2">
        <button
          onClick={onReturnHub}
          className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#251e3d] hover:bg-[#342b52] text-white text-xs border border-[#3d3261] flex items-center justify-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> RETURN TO MENU
        </button>

        {account && !claimedReward && (
          <button
            onClick={handleClaimOnChain}
            disabled={txLoading}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#581c87] hover:bg-[#6b21a8] text-white text-xs border-2 border-[#c084fc] shadow-[0_5px_0_#3b0764] flex items-center justify-center gap-2 transition-all"
          >
            {txLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-400" />}
            CLAIM $SMASH PRIZE
          </button>
        )}

        <button
          onClick={onPlayAgain}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs border-2 border-[#86efac] shadow-[0_6px_0_#15803d] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" /> NEXT RACE
        </button>
      </div>
    </div>
  );
};
