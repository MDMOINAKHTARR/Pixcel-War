import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../../game/GameEngine';
import { MatchScore, CombatFeedEvent } from '../../types/game';
import { WEAPONS } from '../../game/config/weapons';
import { Heart, Shield, Zap, Pause, Play, Award, Crosshair } from 'lucide-react';

interface GameHUDProps {
  engine: GameEngine;
  scores: MatchScore[];
  combatFeed: CombatFeedEvent[];
  timeLeft: number;
  isPaused: boolean;
  onPauseToggle: () => void;
  onQuitMatch: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  engine,
  scores,
  combatFeed,
  timeLeft,
  isPaused,
  onPauseToggle,
  onQuitMatch,
}) => {
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const player = engine.player;
  const currentWeapon = player.currentWeapon ? WEAPONS[player.currentWeapon] : null;

  // Speed in KM/H (speed * 0.42 scaled nicely)
  const speedKmh = Math.round(player.speed * 0.42);

  // Drift Sparks Gauge & Tier (0: None, 1: Blue, 2: Orange, 3: Supreme Purple)
  const driftProgress = Math.min(1.0, player.driftTime / 2.2);
  const driftTier = player.driftStage;

  // Unified Lap Status
  const currentLap = player.currentLap;
  const isFinalLap = currentLap === 3;
  const lapLabel = isFinalLap ? '🏁 FINAL LAP' : `🏁 LAP ${currentLap}/3`;

  // Lap Time & Best Lap
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Rank computation
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

  // Radar rendering
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

      // Radar Plate
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

      const mapW = engine.map.width;
      const mapH = engine.map.height;
      const pad = 16;
      const scaleX = (w - pad * 2) / mapW;
      const scaleY = (h - pad * 2) / mapH;

      // Draw Waypoint Circuit Line
      if (engine.map.waypoints && engine.map.waypoints.length > 2) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const wp = engine.map.waypoints;
        ctx.moveTo(pad + wp[0].x * scaleX, pad + wp[0].y * scaleY);
        for (let i = 1; i < wp.length; i++) {
          ctx.lineTo(pad + wp[i].x * scaleX, pad + wp[i].y * scaleY);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Draw Mystery Pickups (Yellow dots)
      for (const p of engine.pickups) {
        if (!p.isActive) continue;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(pad + p.position.x * scaleX, pad + p.position.y * scaleY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Bot Racers (Red dots)
      for (const b of engine.bots) {
        if (b.isDead) continue;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(pad + b.position.x * scaleX, pad + b.position.y * scaleY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Remote Human Racers (Purple/Gold dots)
      for (const r of engine.remotePlayers.values()) {
        if (r.isDead) continue;
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(pad + r.position.x * scaleX, pad + r.position.y * scaleY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Player Arrow (Cyan Heading)
      if (!player.isDead) {
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
      }

      animId = requestAnimationFrame(renderMinimap);
    };

    renderMinimap();
    return () => cancelAnimationFrame(animId);
  }, [engine, player]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none font-['Press_Start_2P',sans-serif]">
      {/* Pause Modal */}
      {isPaused && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md pointer-events-auto animate-fadeIn">
          <div className="bg-[#1e1738] border-4 border-[#3d3166] p-8 rounded-3xl text-center space-y-6 max-w-sm w-full shadow-[0_0_35px_rgba(0,0,0,0.8)]">
            <h2 className="text-xl md:text-2xl text-white tracking-wider drop-shadow-md">
              MATCH PAUSED
            </h2>
            <div className="space-y-3 font-mono text-xs">
              <button
                onClick={onPauseToggle}
                className="w-full py-3.5 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] text-white font-['Press_Start_2P',sans-serif] text-xs border-2 border-[#d965a9] shadow-[0_5px_0_#5c1d43] transition-all"
              >
                RESUME
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

      {/* TOP BAR: Health/Shield, Weapon Ammo, Timer & Position */}
      <div className="flex items-start justify-between gap-4 pointer-events-auto">
        {/* Top-Left: Pause Button, Health & Shield Bars */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPauseToggle}
            className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] active:translate-y-1 text-white border-2 border-[#d965a9] shadow-[0_4px_0_#5c1d43] flex items-center justify-center transition-all cursor-pointer group"
            title="Pause Match (ESC)"
          >
            {isPaused ? (
              <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
            ) : (
              <Pause className="w-5 h-5 fill-white stroke-[3] group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Health & Shield Bars Plate */}
          <div className="bg-[#1a142e]/95 backdrop-blur-md border-2 border-[#3d3166] px-4 py-2.5 rounded-2xl shadow-lg space-y-2 min-w-[200px]">
            {/* Health Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] text-gray-300">
                <span className="flex items-center gap-1 text-rose-400">
                  <Heart className="w-2.5 h-2.5 fill-rose-500" /> HP
                </span>
                <span className="font-mono">{Math.round(player.health)}/{player.maxHealth}</span>
              </div>
              <div className="h-2.5 bg-[#0f172a] rounded-full overflow-hidden border border-white/10 p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-200 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500"
                  style={{ width: `${Math.max(0, (player.health / player.maxHealth) * 100)}%` }}
                />
              </div>
            </div>

            {/* Shield Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] text-gray-300">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Shield className="w-2.5 h-2.5 fill-cyan-500" /> SHIELD
                </span>
                <span className="font-mono">{Math.round(player.shield)}/{player.maxShield}</span>
              </div>
              <div className="h-2.5 bg-[#0f172a] rounded-full overflow-hidden border border-white/10 p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-200 bg-gradient-to-r from-blue-600 to-cyan-400"
                  style={{ width: `${Math.max(0, (player.shield / player.maxShield) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top-Center: Unified Lap / Final Lap Banner */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={`px-4 py-2 rounded-2xl border-2 backdrop-blur-md text-[10px] md:text-xs font-bold tracking-wider shadow-lg ${
              isFinalLap
                ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-[#1a142e]/95 border-[#3d3166] text-yellow-400'
            }`}
          >
            {lapLabel}
          </div>

          <div className="text-[8px] font-mono text-gray-400 bg-black/60 px-3 py-1 rounded-full border border-white/10">
            TIME: {formatTime(player.currentLapTimer)}
          </div>
        </div>

        {/* Top-Right: Rank Badge */}
        <div
          className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center font-black ${rankBadgeStyle}`}
        >
          <Award className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-xs md:text-sm font-['Press_Start_2P',sans-serif]">{rankSuffix}</span>
        </div>
      </div>

      {/* BOTTOM BAR: Equipped Weapon, Speedometer & Minimap Radar */}
      <div className="flex items-end justify-between gap-4 pointer-events-auto">
        {/* Bottom-Left: Weapon Ammo Box */}
        <div className="bg-[#1a142e]/95 backdrop-blur-md border-2 border-[#3d3166] p-3 md:p-4 rounded-3xl shadow-xl flex items-center gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#251e3d] border-2 border-[#4c3a7a] flex items-center justify-center text-2xl shadow-inner relative">
            {currentWeapon ? (
              <span>{currentWeapon.icon}</span>
            ) : (
              <Crosshair className="w-6 h-6 text-gray-600" />
            )}
            {player.ammo > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded-md shadow">
                x{player.ammo}
              </span>
            )}
          </div>
          <div>
            <div className="text-[8px] text-gray-400">EQUIPPED WEAPON</div>
            <div className="text-xs text-white tracking-wide mt-0.5">
              {currentWeapon ? currentWeapon.name : 'EMPTY'}
            </div>
            <div className="text-[7px] text-gray-500 font-mono mt-0.5">PRESS SPACE / [E] TO FIRE</div>
          </div>
        </div>

        {/* Bottom-Center: Speedometer & Drift Spark Gauge */}
        <div className="flex flex-col items-center gap-2 bg-[#1a142e]/95 backdrop-blur-md border-2 border-[#3d3166] px-6 py-3 rounded-3xl shadow-xl">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight">
              {speedKmh}
            </span>
            <span className="text-[9px] text-gray-400 font-mono">KM/H</span>
          </div>

          {/* 3-Tier Drift Gauge */}
          <div className="w-32 md:w-44 space-y-1">
            <div className="flex justify-between text-[7px] text-gray-400">
              <span>DRIFT BOOST</span>
              <span
                className={`font-bold ${
                  driftTier === 3
                    ? 'text-purple-400'
                    : driftTier === 2
                    ? 'text-orange-400'
                    : driftTier === 1
                    ? 'text-blue-400'
                    : 'text-gray-500'
                }`}
              >
                {driftTier === 3 ? 'SUPREME 🔥' : driftTier === 2 ? 'SUPER ⚡' : driftTier === 1 ? 'TIER 1' : 'READY'}
              </span>
            </div>
            <div className="h-2 bg-[#0f172a] rounded-full overflow-hidden border border-white/10 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  driftTier === 3
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_#c084fc]'
                    : driftTier === 2
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_8px_#f97316]'
                    : driftTier === 1
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_#38bdf8]'
                    : 'bg-gray-700'
                }`}
                style={{ width: `${driftProgress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom-Right: Circular Radar Minimap */}
        <div className="relative">
          <canvas
            ref={minimapCanvasRef}
            width={130}
            height={130}
            className="rounded-full shadow-[0_0_25px_rgba(99,102,241,0.4)]"
          />
        </div>
      </div>
    </div>
  );
};
