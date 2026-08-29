import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MAPS } from '../../game/maps/MapData';
import { BotDifficulty } from '../../types/game';
import { SoundEngine } from '../../game/systems/SoundEngine';
import { PixelArtVehicles, VehicleSkinId } from '../../game/graphics/PixelArtVehicles';
import { ArrowLeft, Play, Users, Cpu, Shield, Zap } from 'lucide-react';

interface LobbyScreenProps {
  onBack: () => void;
  onLaunchGame: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onBack, onLaunchGame }) => {
  const { garage, selectedMap, gameMode, botCount, setBotCount, botDifficulty, setBotDifficulty } = useGameStore();
  const [countdown, setCountdown] = useState<number | null>(null);

  const currentMap = MAPS[selectedMap] || MAPS['neon_city'];

  const botConfigs: { name: string; skin: VehicleSkinId; difficulty: BotDifficulty }[] = [
    { name: 'Sheriff Byte', skin: 'police' as VehicleSkinId, difficulty: botDifficulty },
    { name: 'Wave Rider', skin: 'surf' as VehicleSkinId, difficulty: botDifficulty },
    { name: 'Red Comet', skin: 'red' as VehicleSkinId, difficulty: botDifficulty },
    { name: 'Lord Bigfoot', skin: 'bigfoot' as VehicleSkinId, difficulty: botDifficulty },
    { name: 'Shadow Ghost', skin: 'dark_m' as VehicleSkinId, difficulty: botDifficulty },
    { name: 'Agro Titan', skin: 'harvester' as VehicleSkinId, difficulty: botDifficulty },
  ].slice(0, botCount);

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

        <div className="w-12"></div>
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
          <div className="text-[9px] text-gray-300 font-mono">STATUS: READY TO DEPLOY</div>
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
    PixelArtVehicles.drawVehicle(ctx, skinId, 1.0);
    ctx.restore();
  }, [skinId]);

  return <canvas ref={canvasRef} width={56} height={80} className="pointer-events-none" />;
};
