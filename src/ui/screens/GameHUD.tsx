import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../../game/GameEngine';
import { MatchScore } from '../../types/game';
import { Pause, Play, Flag, RotateCcw, Zap } from 'lucide-react';

interface GameHUDProps {
  engine: GameEngine | null;
  scores: MatchScore[];
  combatFeed?: any[];
  timeLeft: number;
  onPauseToggle: () => void;
  isPaused: boolean;
  onQuitMatch: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  engine,
  scores,
  timeLeft,
  onPauseToggle,
  isPaused,
  onQuitMatch,
}) => {
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!engine) return null;

  const player = engine.player;

  // Approximate speed in KM/H
  const speedKmh = Math.round((player.speed / 380) * 210);

  // Formatting time MM:SS.mmm
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const currentLapFormatted = `${Math.floor(player.currentLapTimer / 60)}:${(player.currentLapTimer % 60).toFixed(2).padStart(5, '0')}`;
  const bestLapFormatted = player.bestLapTime < 900
    ? `${Math.floor(player.bestLapTime / 60)}:${(player.bestLapTime % 60).toFixed(3).padStart(6, '0')}`
    : '--:--.---';

  // Position Rank (1st, 2nd, 3rd...)
  const rankNumber = player.racePosition || 1;
  const rankSuffix =
    rankNumber === 1 ? '1st' : rankNumber === 2 ? '2nd' : rankNumber === 3 ? '3rd' : `${rankNumber}th`;

  const rankBadgeStyle =
    rankNumber === 1
      ? 'bg-[#ca8a04] text-[#fef08a] border-2 border-[#fef08a] shadow-[0_0_20px_rgba(250,204,21,0.7)]'
      : rankNumber === 2
      ? 'bg-[#475569] text-[#f1f5f9] border-2 border-[#cbd5e1] shadow-[0_0_15px_rgba(203,213,225,0.5)]'
      : rankNumber === 3
      ? 'bg-[#9a3412] text-[#fed7aa] border-2 border-[#fb923c] shadow-[0_0_15px_rgba(249,115,22,0.5)]'
      : 'bg-[#1e1b4b] text-[#cbd5e1] border-2 border-[#3730a3]';

  // Dynamic Minimap Radar rendering
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas || !engine) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const renderMinimap = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Radar Outer Circular Plate
      ctx.fillStyle = 'rgba(15, 12, 28, 0.92)';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.48, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Sweep Rings
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.32, 0, Math.PI * 2);
      ctx.arc(w * 0.5, h * 0.5, w * 0.16, 0, Math.PI * 2);
      ctx.stroke();

      // Track bounding box scale
      const mapW = engine.map.width;
      const mapH = engine.map.height;
      const pad = 16;
      const scaleX = (w - pad * 2) / mapW;
      const scaleY = (h - pad * 2) / mapH;

      // Draw Circuit Waypoint Track Line on Radar
      if (engine.map.waypoints && engine.map.waypoints.length > 2) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const wp = engine.map.waypoints;
        ctx.moveTo(pad + wp[0].x * scaleX, pad + wp[0].y * scaleY);
        for (let i = 1; i < wp.length; i++) {
          ctx.lineTo(pad + wp[i].x * scaleX, pad + wp[i].y * scaleY);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Draw Bot Racers (Red/Orange dots)
      for (const b of engine.bots) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(pad + b.position.x * scaleX, pad + b.position.y * scaleY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Player Position (Bright Cyan Triangle Heading Arrow)
      const px = pad + player.position.x * scaleX;
      const py = pad + player.position.y * scaleY;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(player.angle);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(renderMinimap);
    };

    renderMinimap();
    return () => cancelAnimationFrame(animId);
  }, [engine, player]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none font-['Press_Start_2P',sans-serif]">
      {/* Pause Menu Modal Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md pointer-events-auto animate-fadeIn">
          <div className="bg-[#1e1738] border-4 border-[#3d3166] p-8 rounded-3xl text-center space-y-6 max-w-sm w-full shadow-[0_0_35px_rgba(0,0,0,0.8)]">
            <h2 className="text-xl md:text-2xl text-white tracking-wider drop-shadow-md">
              RACE PAUSED
            </h2>
            <div className="space-y-3 font-mono text-xs">
              <button
                onClick={onPauseToggle}
                className="w-full py-3.5 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] text-white font-['Press_Start_2P',sans-serif] text-xs border-2 border-[#d965a9] shadow-[0_5px_0_#5c1d43] transition-all"
              >
                RESUME RACE
              </button>
              <button
                onClick={onQuitMatch}
                className="w-full py-3 rounded-2xl bg-[#2b1f47] border border-[#483770] hover:bg-red-500/20 text-gray-300 hover:text-red-400 font-['Press_Start_2P',sans-serif] text-[10px] transition-all"
              >
                EXIT TO MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR: Pause Chrome, Speedometer, Lap Counter & Position Indicator */}
      <div className="flex items-start justify-between gap-4 pointer-events-auto">
        {/* Top-Left: Pause Chrome & Speedometer */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPauseToggle}
            className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] active:translate-y-1 text-white border-2 border-[#d965a9] shadow-[0_4px_0_#5c1d43] flex items-center justify-center transition-all cursor-pointer group"
            title="Pause Race (ESC)"
          >
            {isPaused ? (
              <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
            ) : (
              <Pause className="w-5 h-5 fill-white stroke-[3] group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Speedometer & 3-Tier Drift Gauge Plate */}
          <div className="bg-[#1a142e]/95 backdrop-blur-md border-2 border-[#3d3166] px-4 py-2.5 rounded-2xl shadow-lg space-y-1.5 min-w-[170px]">
            <div className="text-[10px] text-gray-400 uppercase tracking-widest">SPEED</div>
            <div className="text-sm md:text-base text-cyber-cyan font-bold">{speedKmh} KM/H</div>

            {/* 3-Tier Drift Boost Bar */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[8px] text-gray-400">DRIFT:</span>
              <div className={`w-3 h-2 rounded-sm ${player.driftStage >= 1 ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]' : 'bg-gray-700'}`}></div>
              <div className={`w-3 h-2 rounded-sm ${player.driftStage >= 2 ? 'bg-orange-500 shadow-[0_0_8px_#f97316]' : 'bg-gray-700'}`}></div>
              <div className={`w-3 h-2 rounded-sm ${player.driftStage >= 3 ? 'bg-purple-500 shadow-[0_0_8px_#a855f7] animate-pulse' : 'bg-gray-700'}`}></div>
            </div>
          </div>
        </div>

        {/* Top-Center: Unified Lap Counter & Lap Timers Plate */}
        <div className="flex items-center gap-3">
          {/* Lap Counter Plate */}
          <div className="bg-[#1a142e]/95 backdrop-blur-md border-2 border-[#3d3166] px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2.5 text-white">
            <Flag className="w-4 h-4 text-yellow-400" />
            <span className="text-xs md:text-sm">
              {player.currentLap > player.totalLaps ? 'FINISH' : player.currentLap === player.totalLaps ? 'FINAL LAP' : `LAP ${player.currentLap}/${player.totalLaps}`}
            </span>
          </div>

          {/* Lap Time Plate */}
          <div className="bg-[#1a142e]/95 backdrop-blur-md border-2 border-[#3d3166] px-4 py-2.5 rounded-2xl shadow-lg text-left text-[10px] space-y-1">
            <div className="flex justify-between gap-3 text-gray-300">
              <span className="text-gray-400">LAP:</span>
              <span className="text-white font-mono">{currentLapFormatted}</span>
            </div>
            <div className="flex justify-between gap-3 text-gray-300">
              <span className="text-yellow-400">BEST:</span>
              <span className="text-cyber-cyan font-mono">{bestLapFormatted}</span>
            </div>
          </div>
        </div>

        {/* Top-Right: Position Badge (Rank-Colored 1st-6th) */}
        <div className="flex items-center gap-3">
          <div className={`px-5 py-3 rounded-2xl shadow-xl flex flex-col items-center justify-center ${rankBadgeStyle}`}>
            <span className="text-[8px] uppercase tracking-widest opacity-80">POS</span>
            <span className="text-base md:text-lg tracking-wider">{rankSuffix}</span>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR: Minimap Radar & Wrong-Way Indicator */}
      <div className="flex items-end justify-between gap-4 pointer-events-auto">
        {/* Bottom-Left: Rebuilt Circular Radar Panel */}
        <div className="bg-[#1a142e]/95 backdrop-blur-md border-2 border-[#3d3166] p-2 rounded-3xl shadow-xl flex flex-col items-center">
          <canvas ref={minimapCanvasRef} width={110} height={110} className="rounded-full" />
          <div className="pt-1 text-[8px] text-gray-400 tracking-wider">RADAR</div>
        </div>

        {/* Bottom-Right: Wrong-Way Indicator */}
        <div className="flex flex-col items-end gap-2">
          {player.speed < -50 && (
            <div className="bg-[#e11d48] border-2 border-[#fecdd3] text-white px-4 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(225,29,72,0.8)] flex items-center gap-2 animate-bounce">
              <RotateCcw className="w-4 h-4 stroke-[3]" />
              <span className="text-[10px]">WRONG WAY!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
