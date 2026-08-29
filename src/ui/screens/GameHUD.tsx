import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../../game/GameEngine';
import { MatchScore, CombatFeedEvent } from '../../types/game';
import { WEAPONS } from '../../game/config/weapons';
import {
  Pause,
  Play,
  Zap,
  Flame,
  Radio,
  Bomb,
  Activity,
  WifiOff,
  Snowflake,
  Rocket,
  Shield,
  Heart,
  Flag,
  Crosshair,
  RotateCcw,
} from 'lucide-react';

const WEAPON_ICONS: Record<string, React.ElementType> = {
  blaster: Zap,
  vulcan: Flame,
  laser: Radio,
  mine: Bomb,
  shockwave: Activity,
  emp: WifiOff,
  cryo: Snowflake,
  rocket: Rocket,
};

interface GameHUDProps {
  engine: GameEngine | null;
  scores: MatchScore[];
  combatFeed?: CombatFeedEvent[];
  timeLeft: number;
  onPauseToggle: () => void;
  isPaused: boolean;
  onQuitMatch: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  engine,
  scores,
  combatFeed = [],
  timeLeft,
  onPauseToggle,
  isPaused,
  onQuitMatch,
}) => {
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!engine) return null;

  const player = engine.player;
  const isBattleMode = engine.options.gameMode === 'battle';

  // Active weapon
  const currentWeapon = player.currentWeapon ? WEAPONS[player.currentWeapon] : null;
  const WeaponIcon = currentWeapon && WEAPON_ICONS[currentWeapon.id] ? WEAPON_ICONS[currentWeapon.id] : Zap;

  // Approximate speed in KM/H
  const speedKmh = Math.round((player.speed / 380) * 210);

  // Time formatted MM:SS
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const currentLapFormatted = `${Math.floor(player.currentLapTimer / 60)}:${(player.currentLapTimer % 60).toFixed(2).padStart(5, '0')}`;
  const bestLapFormatted = player.bestLapTime < 900
    ? `${Math.floor(player.bestLapTime / 60)}:${(player.bestLapTime % 60).toFixed(3).padStart(6, '0')}`
    : '--:--.---';

  // Position / Rank
  const playerRankIndex = scores.findIndex((s) => s.isPlayer);
  const rankNumber = playerRankIndex >= 0 ? playerRankIndex + 1 : player.racePosition || 1;
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
                  <Shield className="w-2.5 h-2.5 fill-cyan-400" /> SHIELD
                </span>
                <span className="font-mono">{Math.round(player.shield)}/{player.maxShield}</span>
              </div>
              <div className="h-2 bg-[#0f172a] rounded-full overflow-hidden border border-white/10 p-0.5">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-200 shadow-[0_0_8px_#00f0ff]"
                  style={{ width: `${Math.max(0, (player.shield / player.maxShield) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top-Center: Active Weapon & Ammo Box */}
        {currentWeapon && (
          <div className="bg-[#1a142e]/95 backdrop-blur-md border-2 border-[#3d3166] px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border-2"
              style={{ backgroundColor: `${currentWeapon.color}22`, borderColor: currentWeapon.color }}
            >
              <WeaponIcon className="w-5 h-5" style={{ color: currentWeapon.color }} />
            </div>
            <div className="text-left space-y-1">
              <div className="text-[9px] text-white uppercase">{currentWeapon.name}</div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-gray-400">AMMO:</span>
                <span className="text-xs text-yellow-400 font-mono font-bold">x{player.ammo}</span>
                <span className="text-[7px] text-cyber-cyan bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  [SPACE] FIRE
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top-Right: Timer, Kills & Position Badge */}
        <div className="flex items-center gap-3">
          {/* Time & Kills Plate */}
          <div className="bg-[#1a142e]/95 backdrop-blur-md border-2 border-[#3d3166] px-4 py-2.5 rounded-2xl shadow-lg text-left text-[10px] space-y-1">
            <div className="flex justify-between gap-3 text-gray-300">
              <span className="text-gray-400">TIME:</span>
              <span className="text-white font-mono">{timeFormatted}</span>
            </div>
            <div className="flex justify-between gap-3 text-gray-300">
              <span className="text-rose-400">KILLS:</span>
              <span className="text-yellow-400 font-mono">{player.kills}</span>
            </div>
          </div>

          {/* Position Badge */}
          <div className={`px-5 py-3 rounded-2xl shadow-xl flex flex-col items-center justify-center ${rankBadgeStyle}`}>
            <span className="text-[8px] uppercase tracking-widest opacity-80">POS</span>
            <span className="text-base md:text-lg tracking-wider">{rankSuffix}</span>
          </div>
        </div>
      </div>

      {/* MID-RIGHT: Live Combat Killfeed */}
      {combatFeed.length > 0 && (
        <div className="self-end max-w-xs space-y-1.5 pointer-events-none pr-2">
          {combatFeed.slice(-4).map((event) => (
            <div
              key={event.id}
              className="bg-[#1a142e]/90 border border-[#3d3166] px-3 py-1.5 rounded-xl text-[8px] text-gray-200 shadow-md animate-fadeIn flex items-center gap-1.5"
            >
              <Crosshair className="w-2.5 h-2.5 text-rose-400 flex-shrink-0" />
              <span>
                <strong className="text-cyan-400">{event.killerName}</strong> blasted{' '}
                <strong className="text-yellow-400">{event.victimName}</strong>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* BOTTOM BAR: Minimap Radar, Speedometer & Drift Gauge */}
      <div className="flex items-end justify-between gap-4 pointer-events-auto">
        {/* Bottom-Left: Rebuilt Circular Radar Panel */}
        <div className="bg-[#1a142e]/95 backdrop-blur-md border-2 border-[#3d3166] p-2 rounded-3xl shadow-xl flex flex-col items-center">
          <canvas ref={minimapCanvasRef} width={110} height={110} className="rounded-full" />
          <div className="pt-1 text-[8px] text-gray-400 tracking-wider">RADAR</div>
        </div>

        {/* Bottom-Center / Right: Speedometer & 3-Tier Drift Gauge */}
        <div className="flex items-center gap-3">
          <div className="bg-[#1a142e]/95 backdrop-blur-md border-2 border-[#3d3166] px-4 py-3 rounded-2xl shadow-lg space-y-1 min-w-[160px] text-center">
            <div className="text-[9px] text-gray-400 uppercase tracking-widest">SPEED</div>
            <div className="text-base md:text-lg text-cyber-cyan font-bold">{speedKmh} KM/H</div>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="text-[8px] text-gray-400">DRIFT:</span>
              <div className={`w-3 h-2 rounded-sm ${player.driftStage >= 1 ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]' : 'bg-gray-700'}`}></div>
              <div className={`w-3 h-2 rounded-sm ${player.driftStage >= 2 ? 'bg-orange-500 shadow-[0_0_8px_#f97316]' : 'bg-gray-700'}`}></div>
              <div className={`w-3 h-2 rounded-sm ${player.driftStage >= 3 ? 'bg-purple-500 shadow-[0_0_8px_#a855f7] animate-pulse' : 'bg-gray-700'}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
