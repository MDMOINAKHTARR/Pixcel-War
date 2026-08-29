import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { useWeb3 } from '../../web3/Web3Context';
import { ArrowLeft, CheckSquare, Sparkles, Check, Trophy } from 'lucide-react';

interface QuestsScreenProps {
  onBack: () => void;
}

export const QuestsScreen: React.FC<QuestsScreenProps> = ({ onBack }) => {
  const { quests, claimQuest, stats } = useGameStore();
  const { smashBalance } = useWeb3();

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 space-y-6 bg-[#161226] relative overflow-hidden select-none font-['Press_Start_2P',sans-serif]">
      {/* Checkerboard Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#261f3d_1px,transparent_1px),linear-gradient(to_right,#1d1830_24px,#141021_24px),linear-gradient(to_bottom,#1d1830_24px,#141021_24px)] bg-[size:48px_48px] opacity-70 pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between z-10 relative">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] active:translate-y-1 text-white border-2 border-[#d965a9] shadow-[0_4px_0_#5c1d43] flex items-center justify-center transition-all"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3]" />
        </button>
        <div className="text-center">
          <h1 className="text-base md:text-xl text-white tracking-wide drop-shadow">DAILY BOUNTIES</h1>
          <p className="text-[10px] text-cyber-cyan mt-1 font-['Silkscreen',sans-serif]">
            TIER {stats.level} • {smashBalance} $SMASH
          </p>
        </div>
        <div className="w-12"></div>
      </div>

      {/* Quest Cards List */}
      <div className="max-w-4xl mx-auto w-full space-y-4 z-10 relative">
        {quests.map((q) => {
          const isDone = q.progress >= q.goal;
          const isClaimed = q.claimed;

          return (
            <div
              key={q.id}
              className="bg-[#251e3d] border-2 border-[#3d3261] p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl"
            >
              <div className="space-y-2 text-left w-full md:w-auto">
                <div className="text-xs text-white flex items-center gap-2">
                  <span className="text-yellow-400">⚡</span>
                  <span>{q.title}</span>
                </div>
                <p className="text-[9px] text-gray-300 font-sans">{q.description}</p>
                <div className="w-full md:w-64 bg-[#141021] h-2 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="bg-cyber-cyan h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (q.progress / q.goal) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-[8px] text-gray-400">
                  PROGRESS: {q.progress} / {q.goal}
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <div className="text-[9px] text-right font-mono">
                  <div className="text-yellow-400">+{q.rewardCoins} 🪙</div>
                  <div className="text-cyber-cyan">+{q.rewardTokens} $SMASH</div>
                </div>

                {isClaimed ? (
                  <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-[9px]">
                    CLAIMED
                  </span>
                ) : (
                  <button
                    onClick={() => claimQuest(q.id)}
                    disabled={!isDone}
                    className="px-5 py-3 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] disabled:opacity-40 text-white text-[9px] border-2 border-[#d965a9] shadow-[0_4px_0_#5c1d43] transition-all"
                  >
                    {isDone ? 'CLAIM BOUNTY' : 'LOCKED'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
