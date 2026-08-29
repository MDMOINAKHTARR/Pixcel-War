import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { MAPS } from '../../game/maps/MapData';
import { ArrowLeft, ArrowRight, Check, Trophy, Flame, Swords, Flag, Sparkles } from 'lucide-react';

interface MapSelectScreenProps {
  onBack: () => void;
  onSelectMapAndProceed: () => void;
}

export const MapSelectScreen: React.FC<MapSelectScreenProps> = ({
  onBack,
  onSelectMapAndProceed,
}) => {
  const { selectedMap, setSelectedMap, gameMode, setGameMode } = useGameStore();

  const trackKeys = Object.keys(MAPS);
  const currentMap = MAPS[selectedMap] || MAPS['neon_city'];

  const handlePrev = () => {
    const idx = trackKeys.indexOf(selectedMap);
    const prevIdx = (idx - 1 + trackKeys.length) % trackKeys.length;
    setSelectedMap(trackKeys[prevIdx]);
  };

  const handleNext = () => {
    const idx = trackKeys.indexOf(selectedMap);
    const nextIdx = (idx + 1) % trackKeys.length;
    setSelectedMap(trackKeys[nextIdx]);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 md:p-8 bg-[#161224] relative overflow-hidden select-none animate-fadeIn font-['Press_Start_2P',sans-serif]">
      {/* Checkerboard Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#261f3d_1px,transparent_1px),linear-gradient(to_right,#1d1830_24px,#141021_24px),linear-gradient(to_bottom,#1d1830_24px,#141021_24px)] bg-[size:48px_48px] opacity-70 pointer-events-none"></div>

      {/* Top Header */}
      <div className="text-center pt-2 relative z-10 space-y-3">
        <h1 className="text-xl md:text-2xl tracking-widest text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
          SELECT ARENA & MODE
        </h1>

        {/* Game Mode Selector Toggle */}
        <div className="inline-flex bg-[#1b152d] border-2 border-[#3d3261] p-1.5 rounded-2xl shadow-lg gap-2">
          <button
            onClick={() => setGameMode('battle')}
            className={`px-5 py-2.5 rounded-xl text-[9px] flex items-center gap-2 transition-all ${
              gameMode === 'battle'
                ? 'bg-[#e11d48] text-white border border-[#fda4af] shadow-[0_0_15px_rgba(225,29,72,0.6)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" /> ⚔️ BATTLE ROYALE
          </button>
          <button
            onClick={() => setGameMode('race')}
            className={`px-5 py-2.5 rounded-xl text-[9px] flex items-center gap-2 transition-all ${
              gameMode === 'race'
                ? 'bg-[#22c55e] text-white border border-[#86efac] shadow-[0_0_15px_rgba(34,197,94,0.6)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5" /> 🏁 CIRCUIT RACE
          </button>
        </div>
      </div>

      {/* Main Track Selection & Dioramas Section */}
      <div className="max-w-5xl mx-auto w-full my-auto z-10 space-y-4">
        {/* Top Shelf: 3D Isometric Diorama Pedestals */}
        <div className="bg-[#484064] border-4 border-[#2b2542] rounded-3xl p-4 md:p-6 shadow-[0_12px_24px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-center gap-3 md:gap-6 overflow-x-auto py-2">
            {/* Diorama 1: Neon City */}
            <div
              onClick={() => setSelectedMap('neon_city')}
              className={`p-3 rounded-2xl cursor-pointer transition-all flex flex-col items-center min-w-[120px] ${
                selectedMap === 'neon_city' ? 'bg-[#e11d48]/25 border-2 border-[#e11d48] scale-105 shadow-[0_0_15px_rgba(225,29,72,0.6)]' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <DioramaCity />
              <span className="text-[7px] text-white pt-1 text-center">BLOCKY TOWN</span>
            </div>

            {/* Diorama 2: Desert Dunes */}
            <div
              onClick={() => setSelectedMap('desert_dunes')}
              className={`p-3 rounded-2xl cursor-pointer transition-all flex flex-col items-center min-w-[120px] ${
                selectedMap === 'desert_dunes' ? 'bg-[#e11d48]/25 border-2 border-[#e11d48] scale-105 shadow-[0_0_15px_rgba(225,29,72,0.6)]' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <DioramaDesert />
              <span className="text-[7px] text-white pt-1 text-center">DESERT CANYON</span>
            </div>

            {/* Diorama 3: Snowy Peak */}
            <div
              onClick={() => setSelectedMap('cryo_colosseum')}
              className={`p-3 rounded-2xl cursor-pointer transition-all flex flex-col items-center min-w-[120px] ${
                selectedMap === 'cryo_colosseum' ? 'bg-[#e11d48]/25 border-2 border-[#e11d48] scale-105 shadow-[0_0_15px_rgba(225,29,72,0.6)]' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <DioramaSnow />
              <span className="text-[7px] text-white pt-1 text-center">SNOWY PEAK</span>
            </div>

            {/* Diorama 4: Volcanic Canyon */}
            <div
              onClick={() => setSelectedMap('volcano_canyon')}
              className={`p-3 rounded-2xl cursor-pointer transition-all flex flex-col items-center min-w-[120px] ${
                selectedMap === 'volcano_canyon' ? 'bg-[#f97316]/30 border-2 border-[#f97316] scale-105 shadow-[0_0_20px_rgba(249,115,22,0.8)]' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <DioramaVolcano />
              <span className="text-[7px] text-orange-400 font-bold pt-1 text-center flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" /> VOLCANO
              </span>
            </div>

            {/* Diorama 5: Industrial Matrix */}
            <div
              onClick={() => setSelectedMap('industrial_hazard')}
              className={`p-3 rounded-2xl cursor-pointer transition-all flex flex-col items-center min-w-[120px] ${
                selectedMap === 'industrial_hazard' ? 'bg-[#22c55e]/25 border-2 border-[#22c55e] scale-105 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <DioramaIndustrial />
              <span className="text-[7px] text-white pt-1 text-center">INDUSTRIAL</span>
            </div>

            {/* Diorama 6: Monad Quantum Nexus */}
            <div
              onClick={() => setSelectedMap('monad_nexus')}
              className={`p-3 rounded-2xl cursor-pointer transition-all flex flex-col items-center min-w-[120px] ${
                selectedMap === 'monad_nexus' ? 'bg-[#8354fe]/30 border-2 border-[#8354fe] scale-105 shadow-[0_0_20px_rgba(131,84,254,0.8)]' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <DioramaNexus />
              <span className="text-[7px] text-purple-400 font-bold pt-1 text-center flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> MONAD NEXUS
              </span>
            </div>
          </div>
        </div>

        {/* Selected Track Details & High-Score Leaderboard */}
        <div className="bg-[#241f38] border-2 border-[#3d3261] rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-block px-3 py-1 bg-[#9d3b76]/30 border border-[#d965a9] rounded-full text-[9px] text-[#f472b6] tracking-wider">
              {currentMap.difficulty} ARENA
            </div>
            <h2 className="text-sm md:text-base text-white tracking-wide">
              {currentMap.name}
            </h2>
            <p className="text-gray-300 text-xs font-mono max-w-lg leading-relaxed">
              {currentMap.description}
            </p>
          </div>

          {/* High Score Records */}
          <div className="bg-[#1b152d] border border-[#3d3261] rounded-2xl p-4 min-w-[240px] space-y-2 font-mono text-xs">
            <div className="text-[9px] text-yellow-400 pb-1 border-b border-[#3d3261] flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> ARENA RECORDS
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span className="flex items-center gap-1.5">🥇 Top Kills</span>
              <span className="text-white font-bold">14 Kills</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span className="flex items-center gap-1.5">🥈 Best Lap</span>
              <span className="text-cyber-cyan font-bold">0:08.914</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full z-10 pt-2">
        {/* Left Arrow Button */}
        <button
          onClick={handlePrev}
          className="w-14 h-12 md:w-16 md:h-14 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] active:translate-y-1 text-white border-2 border-[#d965a9] shadow-[0_5px_0_#5c1d43] flex items-center justify-center transition-all group"
          title="Previous Track"
        >
          <ArrowLeft className="w-6 h-6 stroke-[3] group-hover:-translate-x-1 transition-transform" />
        </button>

        {/* Center: Back and Select Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3.5 rounded-2xl bg-[#2b1f47] border border-[#483770] hover:bg-[#38285c] text-gray-300 text-xs transition-all"
          >
            BACK
          </button>

          <button
            onClick={onSelectMapAndProceed}
            className="px-8 py-4 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] active:translate-y-1 text-white text-xs border-2 border-[#86efac] shadow-[0_6px_0_#15803d] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            ENTER ARENA
          </button>
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={handleNext}
          className="w-14 h-12 md:w-16 md:h-14 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] active:translate-y-1 text-white border-2 border-[#d965a9] shadow-[0_5px_0_#5c1d43] flex items-center justify-center transition-all group"
          title="Next Track"
        >
          <ArrowRight className="w-6 h-6 stroke-[3] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

// 3D Isometric Diorama SVG Components
const DioramaDesert = () => (
  <svg viewBox="0 0 160 100" className="w-24 h-16 md:w-32 md:h-20">
    <ellipse cx="80" cy="75" rx="55" ry="18" fill="#78350f" />
    <ellipse cx="80" cy="70" rx="55" ry="18" fill="#b45309" />
    <path d="M 50 70 Q 80 64 110 70" stroke="#fcd34d" strokeWidth="4" fill="none" />
    <polygon points="50,65 70,30 90,65" fill="#d97706" />
    <polygon points="85,65 110,18 135,65" fill="#b45309" />
  </svg>
);

const DioramaSnow = () => (
  <svg viewBox="0 0 160 100" className="w-24 h-16 md:w-32 md:h-20">
    <ellipse cx="80" cy="75" rx="55" ry="18" fill="#0369a1" />
    <ellipse cx="80" cy="70" rx="55" ry="18" fill="#e2e8f0" />
    <path d="M 50 70 Q 80 62 110 70" stroke="#0284c7" strokeWidth="4" fill="none" />
    <polygon points="70,60 80,35 90,60" fill="#0f766e" />
    <polygon points="73,48 80,28 87,48" fill="#14b8a6" />
    <polygon points="76,38 80,20 84,38" fill="#e0f2fe" />
  </svg>
);

const DioramaVolcano = () => (
  <svg viewBox="0 0 160 100" className="w-24 h-16 md:w-32 md:h-20">
    <ellipse cx="80" cy="75" rx="55" ry="18" fill="#1c1917" />
    <ellipse cx="80" cy="70" rx="55" ry="18" fill="#450a0a" />
    <ellipse cx="80" cy="70" rx="42" ry="12" fill="none" stroke="#f97316" strokeWidth="3" />
    <polygon points="56,65 75,32 85,32 104,65" fill="#1c1917" />
    <polygon points="70,65 80,34 90,65" fill="#292524" />
    <ellipse cx="80" cy="32" rx="6" ry="3" fill="#ef4444" />
    <ellipse cx="80" cy="32" rx="3" ry="1.5" fill="#facc15" />
  </svg>
);

const DioramaCity = () => (
  <svg viewBox="0 0 160 100" className="w-24 h-16 md:w-32 md:h-20">
    <ellipse cx="80" cy="75" rx="55" ry="18" fill="#431407" />
    <ellipse cx="80" cy="70" rx="55" ry="18" fill="#7c2d12" />
    <path d="M 50 70 Q 80 62 110 70" stroke="#f97316" strokeWidth="4" fill="none" />
    <rect x="55" y="32" width="18" height="34" fill="#b45309" />
    <rect x="74" y="16" width="24" height="50" fill="#d97706" />
    <rect x="100" y="36" width="16" height="30" fill="#9a3412" />
  </svg>
);

const DioramaIndustrial = () => (
  <svg viewBox="0 0 160 100" className="w-24 h-16 md:w-32 md:h-20">
    <ellipse cx="80" cy="75" rx="55" ry="18" fill="#0f1712" />
    <ellipse cx="80" cy="70" rx="55" ry="18" fill="#143020" />
    <path d="M 50 70 Q 80 62 110 70" stroke="#22c55e" strokeWidth="4" fill="none" />
    <rect x="60" y="30" width="20" height="36" fill="#1e3a29" rx="2" />
    <rect x="85" y="22" width="22" height="44" fill="#2d523b" rx="2" />
  </svg>
);

const DioramaNexus = () => (
  <svg viewBox="0 0 160 100" className="w-24 h-16 md:w-32 md:h-20">
    <ellipse cx="80" cy="75" rx="55" ry="18" fill="#1e003b" />
    <ellipse cx="80" cy="70" rx="55" ry="18" fill="#4c1d95" />
    <path d="M 50 70 Q 80 60 110 70" stroke="#00f0ff" strokeWidth="4" fill="none" />
    <rect x="65" y="28" width="30" height="30" fill="#8354fe" rx="6" />
    <ellipse cx="80" cy="43" rx="10" ry="10" fill="#00f0ff" />
  </svg>
);
