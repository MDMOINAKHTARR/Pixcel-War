import { PlayerKart } from './entities/PlayerKart';
import { BotKart } from './entities/BotKart';
import { Kart, KartInput } from './entities/Kart';
import { Hazard } from './entities/Hazard';
import { ParticleEngine } from './systems/ParticleEngine';
import { SoundEngine } from './systems/SoundEngine';
import { MAPS } from './maps/MapData';
import { Collision } from './physics/Collision';
import { Vector2 } from './physics/Vector2';
import {
  MapDefinition,
  MatchScore,
  GameMode,
  BotDifficulty,
  KartClassId,
} from '../types/game';

export interface GameEngineOptions {
  canvas: HTMLCanvasElement;
  mapId: string;
  gameMode?: GameMode;
  botCount?: number;
  botDifficulty?: BotDifficulty;
  playerClass?: KartClassId;
  playerName?: string;
  playerColors?: { body?: string; accent?: string; underglow?: string; skinId?: any };
  matchDuration?: number;
  onScoreUpdate?: (scores: MatchScore[]) => void;
  onMatchEnd?: (winner: MatchScore, allScores: MatchScore[]) => void;
  onTimerTick?: (timeLeft: number) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: GameEngineOptions;

  public map: MapDefinition;
  public player: PlayerKart;
  public bots: BotKart[] = [];
  public hazards: Hazard[] = [];

  public particleEngine: ParticleEngine;
  public soundEngine: SoundEngine;

  // Camera
  public cameraPos: Vector2 = new Vector2(0, 0);
  public zoom: number = 1.0;

  // Loop & Timing
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastTime: number = 0;
  private animFrameId: number | null = null;

  public raceTimer: number = 0;
  public isMatchOver: boolean = false;
  private scoreUpdateTimer: number = 0;

  constructor(options: GameEngineOptions) {
    this.options = options;
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not obtain 2D canvas context');
    this.ctx = ctx;

    this.map = MAPS[options.mapId] || MAPS['neon_city'];
    this.raceTimer = 0;

    this.particleEngine = new ParticleEngine();
    this.soundEngine = SoundEngine.getInstance();
    this.soundEngine.init();

    // Spawn Player
    const pSpawn = this.map.playerSpawns[0] || { x: 500, y: 500, rotation: 0 };
    this.player = new PlayerKart(
      'player_1',
      options.playerName || 'MonadPilot',
      options.playerClass || 'balanced',
      new Vector2(pSpawn.x, pSpawn.y),
      pSpawn.rotation,
      options.playerColors
    );

    // Spawn Bots
    this.initBots();

    // Spawn Boost Pads
    this.initHazards();

    // Initial Camera
    this.cameraPos.copy(this.player.position);

    this.resizeCanvas();
    window.addEventListener('resize', this.onResize);

    // Resume sound on user interaction
    this.canvas.addEventListener('click', () => {
      this.soundEngine.resume();
    });
    this.canvas.addEventListener('keydown', () => {
      this.soundEngine.resume();
    });
  }

  private onResize = () => {
    this.resizeCanvas();
  };

  private resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const w = parent && parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
    const h = parent && parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight - 64;
    this.canvas.width = Math.max(300, w);
    this.canvas.height = Math.max(300, h);
  }

  private initBots() {
    const botConfigs: { name: string; class: KartClassId; skin: any }[] = [
      { name: 'Sheriff Byte', class: 'balanced', skin: 'police' },
      { name: 'Wave Rider', class: 'drift', skin: 'surf' },
      { name: 'Red Comet', class: 'scout', skin: 'red' },
      { name: 'Lord Bigfoot', class: 'tank', skin: 'bigfoot' },
      { name: 'Shadow Ghost', class: 'cyber', skin: 'dark_m' },
      { name: 'Agro Titan', class: 'tank', skin: 'harvester' },
      { name: 'Santa Turbo', class: 'balanced', skin: 'santa' },
      { name: 'Classic Fox', class: 'drift', skin: 'roadster' },
    ];

    const count = Math.min(this.options.botCount || 4, this.map.playerSpawns.length - 1);

    for (let i = 0; i < count; i++) {
      const spawn = this.map.playerSpawns[i + 1] || { x: 600 + i * 200, y: 600, rotation: 0 };
      const config = botConfigs[i % botConfigs.length];

      const bot = new BotKart(
        `bot_${i + 1}`,
        config.name,
        config.class,
        new Vector2(spawn.x, spawn.y),
        spawn.rotation,
        this.options.botDifficulty || 'veteran',
        { skinId: config.skin } as any
      );
      this.bots.push(bot);
    }
  }

  private initHazards() {
    for (const h of this.map.hazards) {
      this.hazards.push(new Hazard(h));
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.soundEngine.resume();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.player.destroy();
    this.soundEngine.stopEngineSound();
    window.removeEventListener('resize', this.onResize);
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    } else {
      this.soundEngine.stopEngineSound();
    }
    return this.isPaused;
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Cap delta time to prevent physics tunneling
    if (dt > 0.1) dt = 0.1;

    if (!this.isPaused && !this.isMatchOver) {
      this.update(dt);
    }

    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.raceTimer += dt;
    if (this.options.onTimerTick) {
      this.options.onTimerTick(Math.floor(this.raceTimer));
    }

    const allKarts: Kart[] = [this.player, ...this.bots];

    // 1. Update Boost Pads
    for (const hazard of this.hazards) {
      hazard.update(dt);
    }

    // 2. Update Player Kart
    const playerInput = this.player.getInput();
    this.player.update(dt, playerInput, this.particleEngine, this.soundEngine);
    this.player.checkWaypointProgress(this.map.waypoints);

    // Update Engine Sound
    const maxSpeed = this.player.classDef.stats.topSpeed;
    const speedRatio = Math.min(1.0, this.player.speed / maxSpeed);
    this.soundEngine.updateEngineSound(speedRatio, playerInput.throttle > 0);

    // 3. Update Bot Karts
    for (const bot of this.bots) {
      const botInput = bot.updateAI(dt, allKarts, this.map.waypoints);
      bot.update(dt, botInput, this.particleEngine, this.soundEngine);
    }

    // 4. Kart vs Kart Elastic Collisions
    for (let i = 0; i < allKarts.length; i++) {
      for (let j = i + 1; j < allKarts.length; j++) {
        const kA = allKarts[i];
        const kB = allKarts[j];
        if (Collision.circleCircle(kA.position, kA.radius, kB.position, kB.radius)) {
          Collision.resolveElasticCollision(
            kA.position,
            kA.velocity,
            kA.classDef.stats.weight,
            kB.position,
            kB.velocity,
            kB.classDef.stats.weight
          );
          this.particleEngine.emitSparks(kA.position.clone().add(kB.position).multiplyScalar(0.5), 6);
          if (kA.isPlayer || kB.isPlayer) {
            this.soundEngine.playHit();
          }
        }
      }
    }

    // 5. Kart vs Obstacle Collisions
    for (const kart of allKarts) {
      for (const obs of this.map.obstacles) {
        const resolution = Collision.resolveCircleBox(kart.position, kart.radius, obs.x, obs.y, obs.width, obs.height);
        if (resolution.collided) {
          kart.position.add(resolution.penetration);
          kart.velocity.multiplyScalar(0.7);
          this.particleEngine.emitSparks(kart.position, 4);
        }
      }

      // 6. Kart vs Boost Pad Trigger
      for (const hazard of this.hazards) {
        if (hazard.type === 'boost_pad' && hazard.containsPoint(kart.position)) {
          kart.applyBoost(1.4, 1.6);
          this.particleEngine.emitBoostFlames(kart.position, kart.angle);
          if (kart.isPlayer) {
            this.soundEngine.playBoost();
          }
        }
      }

      // 7. Clamp to Arena Boundaries
      kart.position.x = Math.max(kart.radius, Math.min(this.map.width - kart.radius, kart.position.x));
      kart.position.y = Math.max(kart.radius, Math.min(this.map.height - kart.radius, kart.position.y));
    }

    // 8. Update Particle Engine
    this.particleEngine.update(dt);

    // 9. Dynamic Camera
    const targetCamX = this.player.position.x + Math.cos(this.player.angle) * this.player.speed * 0.25;
    const targetCamY = this.player.position.y + Math.sin(this.player.angle) * this.player.speed * 0.25;
    this.cameraPos.x += (targetCamX - this.cameraPos.x) * dt * 5.5;
    this.cameraPos.y += (targetCamY - this.cameraPos.y) * dt * 5.5;

    // 10. Position Tracking & Scoring (Throttled)
    this.scoreUpdateTimer += dt;
    if (this.scoreUpdateTimer >= 0.2) {
      this.scoreUpdateTimer = 0;

      // Rank based on laps completed, current waypoint, and distance to next waypoint
      const wp = this.map.waypoints;
      allKarts.sort((a, b) => {
        const aTargetWp = wp[a.currentWaypointIndex % wp.length];
        const bTargetWp = wp[b.currentWaypointIndex % wp.length];
        const aDist = a.position.distanceTo(new Vector2(aTargetWp.x, aTargetWp.y));
        const bDist = b.position.distanceTo(new Vector2(bTargetWp.x, bTargetWp.y));

        const aScore = a.currentLap * 100000 + a.currentWaypointIndex * 1000 - aDist;
        const bScore = b.currentLap * 100000 + b.currentWaypointIndex * 1000 - bDist;
        return bScore - aScore;
      });

      allKarts.forEach((k, idx) => {
        k.racePosition = idx + 1;
      });

      if (this.options.onScoreUpdate) {
        const scores: MatchScore[] = allKarts.map((k, idx) => ({
          id: k.id,
          name: k.name,
          color: k.bodyColor,
          isPlayer: k.isPlayer,
          kills: 0,
          deaths: 0,
          score: Math.round(1000 / (idx + 1)),
          damageDealt: 0,
          coinsCollected: k.coinsCollected,
          health: 100,
          maxHealth: 100,
          shield: 100,
          maxShield: 100,
        }));
        this.options.onScoreUpdate(scores);
      }
    }

    // 11. Check Race Finish (Player completes 3 laps)
    if (this.player.raceFinished && !this.isMatchOver) {
      this.endMatch();
    }
  }

  private endMatch() {
    this.isMatchOver = true;
    this.soundEngine.stopEngineSound();

    const allKarts = [this.player, ...this.bots];
    allKarts.sort((a, b) => a.racePosition - b.racePosition);

    const scores: MatchScore[] = allKarts.map((k, idx) => ({
      id: k.id,
      name: k.name,
      color: k.bodyColor,
      isPlayer: k.isPlayer,
      kills: 0,
      deaths: 0,
      score: Math.round(1000 / (idx + 1)),
      damageDealt: 0,
      coinsCollected: idx === 0 ? 300 : idx === 1 ? 200 : idx === 2 ? 100 : 50,
      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
    }));

    if (this.options.onMatchEnd) {
      this.options.onMatchEnd(scores[0], scores);
    }
  }

  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear Screen
    ctx.fillStyle = this.map.bgColor;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    // Center camera on player
    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.cameraPos.x, -this.cameraPos.y);

    // 1. Draw Map Background & Grid
    this.renderMapGrid(ctx);

    // 2. Draw Track Road Markings, Turn Arrows & Scenery
    this.renderTrackMarkingsAndScenery(ctx);

    // 3. Draw Skid Marks
    this.particleEngine.renderSkidMarks(ctx);

    // 4. Draw Boost Pads
    for (const hazard of this.hazards) {
      hazard.render(ctx);
    }

    // 5. Draw Obstacles & Walls
    this.renderObstacles(ctx);

    // 6. Draw Karts
    for (const bot of this.bots) {
      bot.render(ctx);
    }
    this.player.render(ctx);

    // 7. Draw Particle FX
    this.particleEngine.render(ctx);

    // 8. Draw Map Outer Boundary Glow
    ctx.strokeStyle = this.map.borderColor;
    ctx.lineWidth = 6;
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.map.borderColor;
    ctx.strokeRect(0, 0, this.map.width, this.map.height);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  private renderMapGrid(ctx: CanvasRenderingContext2D) {
    const gridSize = 100;
    ctx.strokeStyle = this.map.gridColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = 0; x <= this.map.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.map.height);
    }
    for (let y = 0; y <= this.map.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.map.width, y);
    }
    ctx.stroke();

    // Draw White Starting Grid Boxes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    for (const spawn of this.map.playerSpawns) {
      ctx.save();
      ctx.translate(spawn.x, spawn.y);
      ctx.rotate(spawn.rotation);
      ctx.strokeRect(-18, -26, 36, 52);
      ctx.restore();
    }

    // Draw Starting Line Checkered Banner
    const pSpawn = this.map.playerSpawns[0] || { x: 500, y: 500 };
    ctx.save();
    ctx.translate(pSpawn.x - 60, pSpawn.y);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(col * 15, row * 15, 15, 15);
      }
    }
    ctx.restore();
  }

  private renderObstacles(ctx: CanvasRenderingContext2D) {
    for (const obs of this.map.obstacles) {
      ctx.save();

      if (this.map.theme === 'volcano') {
        // Obsidian Magma Peak
        ctx.fillStyle = '#0c0a09';
        ctx.fillRect(obs.x - 6, obs.y - 6, obs.width + 12, obs.height + 12);
        ctx.fillStyle = obs.color || '#450a0a';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Lava Cracks
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(obs.x + 20, obs.y + 20);
        ctx.lineTo(obs.x + obs.width * 0.5, obs.y + obs.height * 0.5);
        ctx.lineTo(obs.x + obs.width - 20, obs.y + obs.height - 20);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Sidewalk Curb Stone Border
        ctx.fillStyle = '#64748b';
        ctx.fillRect(obs.x - 6, obs.y - 6, obs.width + 12, obs.height + 12);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(obs.x - 4, obs.y - 4, obs.width + 8, obs.height + 8);

        // Building Base
        ctx.fillStyle = obs.color || '#991b1b';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Shingle Rows
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let ty = obs.y + 8; ty < obs.y + obs.height; ty += 12) {
          ctx.fillRect(obs.x, ty, obs.width, 2);
        }

        // Outline
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
      }

      ctx.restore();
    }
  }

  private renderTrackMarkingsAndScenery(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // 1. Center Dashed Road Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.setLineDash([24, 20]);

    if (this.map.waypoints && this.map.waypoints.length > 2) {
      ctx.beginPath();
      const wp = this.map.waypoints;
      ctx.moveTo(wp[0].x, wp[0].y);
      for (let i = 1; i < wp.length; i++) {
        ctx.lineTo(wp[i].x, wp[i].y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset dashed

    // 2. Painted Road Turn Arrows
    for (let i = 0; i < this.map.waypoints.length; i++) {
      const p1 = this.map.waypoints[i];
      const p2 = this.map.waypoints[(i + 1) % this.map.waypoints.length];
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      ctx.save();
      ctx.translate(p1.x, p1.y);
      ctx.rotate(angle);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(0, -10);
      ctx.lineTo(0, -4);
      ctx.lineTo(-14, -4);
      ctx.lineTo(-14, 4);
      ctx.lineTo(0, 4);
      ctx.lineTo(0, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // 3. Volcanic Canyon Lava River & Magma Glow
    if (this.map.theme === 'volcano' || this.map.id === 'volcano_canyon') {
      const time = Date.now() * 0.003;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ef4444';

      ctx.beginPath();
      for (let x = 100; x < this.map.width; x += 180) {
        const wave = Math.sin(time + x * 0.04) * 12;
        ctx.arc(x, 150 + wave, 30, 0, Math.PI);
        ctx.arc(x, this.map.height - 150 + wave, 30, Math.PI, 0);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 4. Snowy Peak Shoreline & Pine Trees
    if (this.map.theme === 'cryo' || this.map.id === 'cryo_colosseum') {
      const time = Date.now() * 0.002;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      for (let x = 100; x < this.map.width; x += 160) {
        const wave = Math.sin(time + x * 0.05) * 8;
        ctx.arc(x, 180 + wave, 24, 0, Math.PI);
        ctx.arc(x, this.map.height - 180 + wave, 24, Math.PI, 0);
      }
      ctx.stroke();

      const treeClusters = [
        { x: 300, y: 300 },
        { x: 360, y: 280 },
        { x: 420, y: 310 },
        { x: 480, y: 270 },
        { x: 540, y: 300 },
        { x: 1800, y: 300 },
        { x: 1860, y: 270 },
        { x: 1920, y: 310 },
        { x: 1980, y: 280 },
        { x: 300, y: 1900 },
        { x: 360, y: 1870 },
        { x: 420, y: 1910 },
        { x: 1800, y: 1900 },
        { x: 1860, y: 1870 },
        { x: 1920, y: 1910 },
      ];

      for (const t of treeClusters) {
        this.renderFrostedPineTree(ctx, t.x, t.y);
      }
    }

    ctx.restore();
  }

  private renderFrostedPineTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.beginPath();
    ctx.ellipse(4, 8, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5eead4';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#14b8a6';
    ctx.beginPath();
    ctx.arc(0, -2, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#99f6e4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(0, -4, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
